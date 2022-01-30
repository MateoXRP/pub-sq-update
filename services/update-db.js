const cron = require('node-cron');

const { checkUpdateStatusAndUpdateDb } = require('../controllers/update');
const updatingDisabled = require('../config/keys').updatingDisabled;

// DEV ONLY: run update every minute
const testingSchedule = '1 * * * * *';

// NORMAL SCHEDULE: run update every hour at 1 minute past the hour
const schedule = '1 * * * *';

const task = cron.schedule(schedule, async function () {
  console.count('<==== Updating database ====>');
  console.log('timestamp: ', new Date());

  checkUpdateStatusAndUpdateDb();
});

const updateDB = async () => {
  if (updatingDisabled) {
    console.log('Update disabled');
    task.stop();
  } else {
    console.log('Starting update task...');
    task.start();
  }
};

module.exports = { updateDB };
