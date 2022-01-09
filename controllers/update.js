const { Update } = require('../models/Update');
const { getPostTxAndUpdateDB } = require('./posts');
const { getCommentTxAndUpdateDB } = require('./comments');
const { getLikeTxAndUpdateDB } = require('./likes');

const defaultEndDate = () => {
  const date = new Date('11-30-2021');
  const endDate = date.getTime() / 1000 - 946684800;
  console.log('default endDate: ', endDate);
  return endDate;
};

const getNextEndDate = async () => {
  try {
    const lastUpdate = await Update.find().sort({ lastUpdatedAt: -1 }).limit(1);
    if (lastUpdate.length === 0) {
      console.log('Using defaultEndDate');
    }

    console.log('lastUpdate: ', lastUpdate);

    const nextEndDate =
      lastUpdate.length > 0 ? lastUpdate[0].nextEndDate : defaultEndDate();

    return nextEndDate;
  } catch (error) {
    console.log(error);
  }
};

const createUpdateRecord = async ({
  newEndDate,
  totalPostsSaved,
  totalCommentsSaved,
  totalLikesSaved
}) => {
  console.log('createUpdateRecord');
  try {
    const unixEndDate = newEndDate.getTime() / 1000 - 946684800;
    // console.log('unixEndDate:', unixEndDate);

    const newUpdate = new Update({
      nextEndDate: unixEndDate,
      totalPostsSaved,
      totalCommentsSaved,
      totalLikesSaved,
      lastUpdatedAt: Date.now()
    });

    const update = await newUpdate.save();
    console.log('update:', update);
  } catch (error) {
    console.log('error:', error);
  }
};

const updateDb = async () => {
  try {
    const newEndDate = new Date();

    const endDate = await getNextEndDate();
    // console.log('endDate: ', endDate);

    // update post db
    const totalPostsSaved = await getPostTxAndUpdateDB(endDate);
    // let totalPostsSaved = 0;
    console.log('totalPostsSaved: ', totalPostsSaved);

    // // update comment db
    const totalCommentsSaved = await getCommentTxAndUpdateDB(endDate);
    // let totalCommentsSaved = 0;
    console.log('totalCommentsSaved: ', totalCommentsSaved);

    // // update like db
    const totalLikesSaved = await getLikeTxAndUpdateDB(endDate);
    // let totalLikesSaved = 0;
    console.log('totalLikesSaved: ', totalLikesSaved);

    // save new endDate to db
    await createUpdateRecord({
      newEndDate,
      totalPostsSaved,
      totalCommentsSaved,
      totalLikesSaved
    });

    console.log('updateDB finished');
  } catch (error) {
    console.log('error:', error);
  }
};

const checkUpdateStatusAndUpdateDb = async () => {
  try {
    const isUpdating = await updateStatus.getUpdateStatus();

    if (isUpdating) {
      console.log('Update in progress');
      return;
    } else {
      console.log('Starting update');
      await updateStatus.setUpdateStatus(true);
      await updateDb();
      await updateStatus.setUpdateStatus(false);
      console.log('Update complete');
      return;
    }
  } catch (error) {
    console.log('error:', error);
  }
};

class UpdateStatusClass {
  constructor(isUpdating) {
    this.isUpdating = isUpdating;
  }

  getUpdateStatus() {
    // console.log('getUpdateStatus: ', this.isUpdating);
    return this.isUpdating;
  }

  setUpdateStatus(status) {
    this.isUpdating = status;
    // console.log('setUpdateStatus: ', this.isUpdating);
    return this.isUpdating;
  }
}

const updateStatus = new UpdateStatusClass(false);

module.exports = { updateDb, checkUpdateStatusAndUpdateDb };
