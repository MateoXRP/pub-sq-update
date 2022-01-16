const express = require('express');
const cron = require('node-cron');

const { connectDB } = require('./services/mongodb');

const { checkUpdateStatusAndUpdateDb } = require('./controllers/update');
const updatingPaused = require('../config/keys').updatingPaused;
const app = express();

connectDB();

// Cron - auto update stats/leaderboards
// interval - every hour at *:59

// Disable on scheduled update on test to prevent duplicating production update
cron.schedule('10 * * * * * *', async function () {
  console.log('');
  if (updatingPaused === true) {
    console.log('Update disabled');
  } else {
    console.count('<==== Updating database ====>');
    console.log('timestamp: ', new Date());

    checkUpdateStatusAndUpdateDb();
  }
});

// Initialize middleware
app.use(express.json({ extended: false }));

// Routes
// app.use('/api/posts', require('./routes/api/posts'));

// Set port for heroku or local
const PORT = process.env.PORT || 5000;

// Start server
app.listen(PORT, (error) => {
  if (error) throw error;
  console.log(`Listening on port ${PORT}`);
});
