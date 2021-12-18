const { Post } = require('../models/Post');
const { Comment } = require('../models/Comment');

const { getUserId } = require('../controllers/users');
const { getAccountTxByMarker } = require('../services/xrpl-client');
const {
  getTimestamp,
  getTxAmountData,
  parseMemoData
} = require('../util/tx-data');

const checkIfCommentTxExistsInDB = async (hash) =>
  new Promise(async function (resolve, reject) {
    try {
      const result = await Comment.findOne({ hash });
      resolve(!!result);
    } catch (error) {
      reject(error);
    }
  });

const saveCommentToDB = async (data) => {
  const { Account, Amount, date, hash, Memos } = data;

  try {
    const user = await getUserId(Account);

    // parse post hash and comment content from memos field
    const memoData = parseMemoData(Memos);
    const commentContent = memoData.substring(65);
    const postHash = memoData.substring(0, 64);
    console.log('postHash', postHash);
    const amountData = getTxAmountData(Amount);

    // content has post hash
    const post = await Post.findOne({ hash: postHash });

    if (!post) {
      const res = `Post not found, skipping...`;
      return res;
    }

    const commentData = {
      postId: post._id,
      postHash: postHash,
      user,
      userAccount: Account,
      amount: amountData,
      date: getTimestamp(date),
      hash,
      content: commentContent
    };

    // create new comment doc
    const newComment = new Comment(commentData);

    //  save comment to DB
    const comment = await newComment.save();

    post.comments.unshift(comment._id);

    const updatedPost = await post.save();

    // return updated post
    return updatedPost;
  } catch (error) {
    console.log(error);
    return error;
  }
};

const checkCommentTxAndSaveToDB = async (commentTx) => {
  try {
    const commentExists = await checkIfCommentTxExistsInDB(commentTx.hash);
    if (commentExists) {
      console.count('Comment exists');
      return;
    }

    console.log('saving comment to db');
    const result = await saveCommentToDB(commentTx);
    console.log('comment save result: ', result);

    return result;
  } catch (error) {
    console.log(error);
  }
};

const getCommentTxAndUpdateDB = async (endDate) => {
  console.log('endDate: ', endDate);
  let endDateReached = false;
  let marker = null;
  try {
    while (!endDateReached) {
      // get batch of account tx
      const txBatch = await getAccountTxByMarker(100, marker);

      // filter for post tx
      const commentTransactions = txBatch.transactions.filter(
        (record) =>
          (record.tx.TransactionType === 'Payment') &
          (record.tx.DestinationTag === 100)
      );

      if (commentTransactions.length > 0) {
        // map thru post tx array
        for (i = 0; i < commentTransactions.length; i++) {
          const result = await saveCommentTxToDB(commentTransactions[i].tx);
          console.log('save result: ', result);
        }

        // check oldest comment in batch
        const oldestComment =
          commentTransactions[commentTransactions.length - 1];

        const timestamp = await getTimestamp(oldestComment.tx.date);
        console.log('oldest comment date: ', timestamp);

        if (oldestComment.tx.date <= endDate) {
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

    console.log('Comments collection seeding complete');
  } catch (error) {
    console.log(error);
  }
};

module.exports = {
  checkIfCommentTxExistsInDB,
  saveCommentToDB,
  checkCommentTxAndSaveToDB,
  getCommentTxAndUpdateDB
};
