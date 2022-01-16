const cron = require('node-cron');

const { checkUpdateStatusAndUpdateDb } = require('../controllers/update');
const updatingStatus = require('../config/keys').updatingStatus;

const task = cron.schedule('10 * * * * * *', async function () {
  console.count('<==== Updating database ====>');
  console.log('timestamp: ', new Date());

  checkUpdateStatusAndUpdateDb();
});

const updateDB = async () => {
  console.log('updatingStatus: ', updatingStatus);
  console.log(updatingStatus == 'off');
  console.log(typeof updatingStatus);

  if (updatingStatus == 'off') {
    console.log('Update disabled');
    task.stop();
  } else {
    console.log('Starting update task...');
    task.start();
  }
};

module.exports = { updateDB };
