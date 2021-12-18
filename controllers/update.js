const { Update } = require('../models/Update');
const { getPostTxAndUpdateDB } = require('../posts');
const { getCommentTxAndUpdateDB } = require('../comments');
const { getLikeTxAndUpdateDB } = require('../likes');

const defaultEndDate = () => {
  const date = new Date('10-28-2021');
  const endDate = date.getTime() / 1000 - 946684800;
  console.log('default endDate: ', endDate);
  return endDate;
};

const getNextEndDate = async () => {
  try {
    const lastUpdate = await Update.find().sort({ lastUpdatedAt: -1 }).limit(1);

    const nextEndDate =
      lastUpdate.length > 0 ? lastUpdate[0].nextEndDate : defaultEndDate();

    return nextEndDate;
  } catch (error) {
    console.log(error);
  }
};

const updateEndDate = async (date) => {
  console.log('updateEndDate');
  try {
    const unixEndDate = date.getTime() / 1000 - 946684800;
    console.log('unixEndDate:', unixEndDate);

    const newUpdate = new Update({
      nextEndDate: unixEndDate
    });

    const update = await newUpdate.save();
    console.log('update:', update);
  } catch (error) {
    console.log('error:', error);
  }
};

const updateDb = async () => {
  console.log('update controller: ', new Date());

  try {
    const newEndDate = new Date();

    const endDate = await getNextEndDate();
    console.log('endDate: ', endDate);

    // update post db
    await getPostTxAndUpdateDB(endDate);
    // update comment db
    await getCommentTxAndUpdateDB(endDate);
    // update like db
    await getLikeTxAndUpdateDB(endDate);

    // save new endDate to db
    await updateEndDate(newEndDate);

    console.log('updateDb complete');
    return;
  } catch (error) {
    console.log('error:', error);
  }
};

module.exports = { updateDb };
