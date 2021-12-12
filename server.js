const express = require('express');
const path = require('path');
const connectDB = require('./services/mongodb');
const cron = require('node-cron');

const { updateDatabase } = require('./services/updateDatabase');

const app = express();

connectDB();

// Cron - auto update stats/leaderboards
// interval - every day at 11:59pm

// Disable on scheduled update on test to prevent duplicating production update
cron.schedule('59 23 * * *', function () {
  console.log('<==== Updating database ====>');
  updateDatabase();
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
