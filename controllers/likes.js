const { Post } = require('../models/Post');
const { Like } = require('../models/Like');

const { getUserId } = require('../controllers/users');
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

    if (!post) {
      const res = `Post not found, skipping...`;
      return res;
    }

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

    // save like to post record
    post.likes.unshift(like._id);

    const updatedPost = await post.save();

    // return updated post
    return updatedPost;
  } catch (error) {
    console.log(error);
    return error;
  }
};

const checkLikeTxAndSaveToDB = async (like) => {
  try {
    const likeExists = await checkIfLikeTxExistsInDB(like.hash);
    if (likeExists) {
      console.count('Like exists');
      return;
    }
    console.log('saving like to db');
    const result = await saveLikeToDB(like);
    console.log('like save result: ', result);

    return result;
  } catch (error) {
    console.log(error);
  }
};

const getLikeTxAndUpdateDB = async (endDate) => {
  console.log('endDate: ', endDate);
  let endDateReached = false;
  let marker = null;

  try {
    while (!endDateReached) {
      // get batch of account tx
      const txBatch = await getAccountTxByMarker(100, marker);

      // filter for post tx
      const likeTransactions = txBatch.transactions.filter(
        (record) =>
          (record.tx.TransactionType === 'Payment') &
          (record.tx.DestinationTag === 101)
      );

      if (likeTransactions.length > 0) {
        // map thru post tx array
        for (i = 0; i < likeTransactions.length; i++) {
          const result = await saveLikeTxToDB(likeTransactions[i].tx);
          console.log('save result: ', result);
        }

        // check oldest like in batch
        const oldestLike = likeTransactions[likeTransactions.length - 1];

        const timestamp = await getTimestamp(oldestLike.tx.date);
        console.log('oldest like date: ', timestamp);

        if (oldestLike.tx.date <= endDate) {
          endDateReached = true;
          console.log('End date reached');
        } else {
          console.log('txBatch marker: ', txBatch.marker);
          marker = txBatch.marker;
        }
      } else {
        console.log('txBatch marker: ', txBatch.marker);
        marker = txBatch.marker;
      }
    }
    console.log('Likes collection seeding complete');
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
