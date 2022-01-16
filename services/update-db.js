const cron = require('node-cron');

const { checkUpdateStatusAndUpdateDb } = require('../controllers/update');
const updatingStatus = require('../config/keys').updatingStatus;
const updatingPaused = require('../config/keys').updatingPaused;

const task = cron.schedule('10 * * * * * *', async function () {
  console.count('<==== Updating database ====>');
  console.log('timestamp: ', new Date());

  checkUpdateStatusAndUpdateDb();
});

const updateDB = async () => {
  console.log('updatingPaused: ', updatingPaused);
  console.log(typeof updatingPaused);
  console.log(!!updatingPaused);

  if (!!updatingPaused) {
    console.log('Update disabled');
    task.stop();
  } else {
    console.log('Starting update task...');
    task.start();
  }
};

module.exports = { updateDB };
