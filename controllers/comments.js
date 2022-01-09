const { Post } = require('../models/Post');
const { Comment } = require('../models/Comment');

const { getUserId } = require('./users');
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
    console.log('post', post);

    if (!post) return { commentSaved: false };

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
    console.log('comment saved: ', comment);

    post.comments.unshift(comment._id);

    const updatedPost = await post.save();
    console.log('post updated: ', updatedPost);

    const commentSaved = !!comment && !!updatedPost;
    console.log('commentSaved: ', commentSaved);

    // return update status
    return { commentSaved };
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
      return { commentSaved: false };
    }

    console.log('saving comment to db');
    const { commentSaved } = await saveCommentToDB(commentTx);
    console.log('commentSaved: ', commentSaved);

    return { commentSaved };
  } catch (error) {
    console.log(error);
  }
};

const getCommentTxAndUpdateDB = async (endDate) => {
  console.log('getCommentTxAndUpdateDB');
  let endDateReached = false;
  let marker = null;
  let totalCommentsSaved = 0;

  try {
    while (!endDateReached) {
      // get batch of account tx
      const txBatch = await getAccountTxByMarker(20, marker);

      // filter for post tx
      const commentTransactions = txBatch.transactions.filter(
        (record) =>
          (record.tx.TransactionType === 'Payment') &
          (record.tx.DestinationTag === 100)
      );

      // if comment tx found, check/save
      if (commentTransactions.length > 0) {
        // map thru post tx array
        for (i = 0; i < commentTransactions.length; i++) {
          const { commentSaved } = await checkCommentTxAndSaveToDB(
            commentTransactions[i].tx
          );
          console.log('commentSaved: ', commentSaved);

          if (commentSaved) totalCommentsSaved++;
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

    console.log('Comments collection update complete');
    console.log('Total comments saved: ', totalCommentsSaved);
    return totalCommentsSaved;
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
