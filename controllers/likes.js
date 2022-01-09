const { Post } = require('../models/Post');
const { Like } = require('../models/Like');

const { getUserId } = require('./users');
const { getAccountTxByMarker } = require('../services/xrpl-client');
const {
  getTimestamp,
  getTxAmountData,
  parseMemoData
} = require('../util/tx-data');

const checkIfLikeTxExistsInDB = async (hash) =>
  new Promise(async function (resolve, reject) {
    try {
      const result = await Like.findOne({ hash });
      resolve(!!result);
    } catch (error) {
      reject(error);
    }
  });

const saveLikeToDB = async (data) => {
  const { Account, Amount, date, hash, Memos } = data;

  try {
    const user = await getUserId(Account);

    // parse post hash from memos field
    const postHash = parseMemoData(Memos);
    console.log('postHash', postHash);
    const amountData = getTxAmountData(Amount);

    // content has post hash
    const post = await Post.findOne({ hash: postHash });

    if (!post) return { likeSaved: false };

    const likeData = {
      postId: post._id,
      postHash: post.hash,
      user,
      userAccount: Account,
      amount: amountData,
      date: getTimestamp(date),
      hash
    };

    // create new comment doc
    const newLike = new Like(likeData);

    //  save like to DB
    const like = await newLike.save();
    console.log('like saved: ', like);

    // save like to post record
    post.likes.unshift(like._id);

    const updatedPost = await post.save();
    console.log('post updated: ', updatedPost);

    const likeSaved = !!like && !!updatedPost;

    // return updated status
    return { likeSaved };
  } catch (error) {
    console.log(error);
    return error;
  }
};

const checkLikeTxAndSaveToDB = async (likeTx) => {
  try {
    const likeExists = await checkIfLikeTxExistsInDB(likeTx.hash);
    if (likeExists) {
      console.count('Like exists');
      return { likeSaved: false };
    }

    console.log('saving like to db');
    const { likeSaved } = await saveLikeToDB(likeTx);
    console.log('like saved: ', likeSaved);

    return { likeSaved };
  } catch (error) {
    console.log(error);
  }
};

const getLikeTxAndUpdateDB = async (endDate) => {
  console.log('getLikeTxAndUpdateDB');
  let endDateReached = false;
  let marker = null;
  let totalLikesSaved = 0;

  try {
    while (!endDateReached) {
      // get batch of account tx
      const txBatch = await getAccountTxByMarker(20, marker);

      // filter for post tx
      const likeTransactions = txBatch.transactions.filter(
        (record) =>
          (record.tx.TransactionType === 'Payment') &
          (record.tx.DestinationTag === 101)
      );

      if (likeTransactions.length > 0) {
        // map thru post tx array
        for (i = 0; i < likeTransactions.length; i++) {
          const { likeSaved } = await checkLikeTxAndSaveToDB(
            likeTransactions[i].tx
          );
          console.log('likeSaved: ', likeSaved);

          if (likeSaved) totalLikesSaved++;
        }
      }

      // check oldest tx in batch
      const oldestTx = txBatch.transactions[txBatch.transactions.length - 1];
      console.log('oldest tx date: ', oldestTx.tx.date);
      console.log('endDate: ', endDate);

      if (oldestTx.tx.date <= endDate) {
        endDateReached = true;
        console.log('End date reached: ', getTimestamp(oldestTx.tx.date));
      } else {
        console.log('txBatch marker: ', txBatch.marker);
        marker = txBatch.marker;
      }
    }

    console.log('Likes collection update complete');
    console.log('Total likes saved: ', totalLikesSaved);
  } catch (error) {
    console.log(error);
  }
};

module.exports = {
  checkIfLikeTxExistsInDB,
  saveLikeToDB,
  checkLikeTxAndSaveToDB,
  getLikeTxAndUpdateDB
};
