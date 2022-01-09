const { Post } = require('../models/Post');
const { getUserId } = require('./users');
const { getAccountTxByMarker } = require('../services/xrpl-client');
const { isBlacklisted } = require('../util/is-blacklisted');
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
    return { postSaved: !!post };
  } catch (error) {
    console.log(error);
    return { postSaved: false };
  }
};

const checkPostTxAndSaveToDB = async (postTx) => {
  try {
    const postExists = await checkIfPostTxExistsInDB(postTx.hash);
    if (postExists) {
      console.count('Post exists');
      return { postSaved: false };
    }
    const postBlacklisted = await isBlacklisted(postTx.hash);
    if (postBlacklisted) {
      console.count('Post blacklisted');
      return { postSaved: false };
    }

    const { postSaved } = await savePostToDB(postTx);

    return { postSaved };
  } catch (error) {
    console.log(error);
  }
};

const getPostTxAndUpdateDB = async (endDate) => {
  let endDateReached = false;
  let marker = null;
  let totalPostsSaved = 0;

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

      // if post tx found, check/save
      if (postTransactions.length > 0) {
        // map thru post tx array
        for (i = 0; i < postTransactions.length; i++) {
          const { postSaved } = await checkPostTxAndSaveToDB(
            postTransactions[i].tx
          );
          console.log('postSaved: ', postSaved);

          if (postSaved) totalPostsSaved++;
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

    console.log('Posts collection update complete');
    console.log('Total posts saved: ', totalPostsSaved);
    return totalPostsSaved;
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
