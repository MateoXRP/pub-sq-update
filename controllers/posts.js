const { Post } = require('../models/Post');
const { getUserId } = require('../controllers/users');
const { getAccountTxByMarker } = require('../services/xrpl-client');
const { isBlacklisted } = require('../util/blacklist');
const {
  getTimestamp,
  getTxAmountData,
  parseMemoData
} = require('../util/tx-data');

const checkIfPostTxExistsInDB = async (hash) =>
  new Promise(async function (resolve, reject) {
    try {
      const result = await Post.findOne({ hash });
      resolve(!!result);
    } catch (error) {
      reject(error);
    }
  });

const savePostToDB = async (data) => {
  const { Account, Amount, date, hash, Memos } = data;

  try {
    const user = await getUserId(Account);

    const postContent = parseMemoData(Memos);

    const amountData = getTxAmountData(Amount);

    const postData = {
      author: user,
      userAccount: Account,
      amount: amountData,
      date: getTimestamp(date),
      hash,
      content: postContent
    };

    // create new Post doc
    const newPost = new Post(postData);

    //  save post to DB
    const post = await newPost.save();

    // return post
    return post;
  } catch (error) {
    console.log(error);
    return error;
  }
};

const checkPostTxAndSaveToDB = async (postTx) => {
  try {
    const postExists = await checkIfPostTxExistsInDB(postTx.hash);
    if (postExists) {
      console.count('Post exists');
      return;
    }
    const postBlacklisted = await isBlacklisted(postTx.hash);
    if (postBlacklisted) {
      console.count('Post blacklisted');
      return;
    }

    console.log('saving post to db');

    const result = await savePostToDB(postTx);
    console.log('post save result: ', result);

    return result;
  } catch (error) {
    console.log(error);
  }
};

const getPostTxAndUpdateDB = async (endDate) => {
  console.log('endDate: ', endDate);
  let endDateReached = false;
  let marker = null;

  try {
    while (!endDateReached) {
      // get batch of account tx
      const txBatch = await getAccountTxByMarker(10, marker);

      // filter for post tx
      const postTransactions = txBatch.transactions.filter(
        (record) =>
          (record.tx.TransactionType === 'Payment') &
          (record.tx.DestinationTag === 99)
      );

      // map thru post tx array
      for (i = 0; i < postTransactions.length; i++) {
        const result = await checkPostTxAndSaveToDB(postTransactions[i].tx);
        console.log('post save result: ', result);
      }

      // check oldest post in batch
      const oldestPost = postTransactions[postTransactions.length - 1];

      const timestamp = await getTimestamp(oldestPost.tx.date);
      console.log('oldest post date: ', timestamp);

      if (oldestPost.tx.date <= endDate) {
        endDateReached = true;
        console.log('End date reached');
      } else {
        console.log('txBatch marker: ', txBatch.marker);
        marker = txBatch.marker;
      }
    }

    console.log('Posts collection update complete');
  } catch (error) {
    console.log(error);
  }
};

module.exports = {
  checkIfPostTxExistsInDB,
  savePostToDB,
  checkPostTxAndSaveToDB,
  getPostTxAndUpdateDB
};
