const express = require('express');
const connectDB = require('./services/mongodb');
const cron = require('node-cron');

const { updateDB } = require('./services/updateDB');

const app = express();

// connectDB();

// Cron - auto update stats/leaderboards
// interval - every hour at *:59

// Disable on scheduled update on test to prevent duplicating production update
cron.schedule('59 * * * * *', function () {
  console.log('<==== Updating database ====>');
  updateDB();
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
