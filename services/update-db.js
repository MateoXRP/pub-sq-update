const cron = require('node-cron');

const { checkUpdateStatusAndUpdateDb } = require('../controllers/update');
const updatingDisabled = require('../config/keys').updatingDisabled;

const task = cron.schedule('10 * * * * * *', async function () {
  console.count('<==== Updating database ====>');
  console.log('timestamp: ', new Date());

  checkUpdateStatusAndUpdateDb();
});

const updateDB = async () => {
  if (!!updatingDisabled) {
    console.log('Update disabled');
    task.stop();
  } else {
    console.log('Starting update task...');
    task.start();
  }
};

module.exports = { updateDB };
