const express = require('express');

const { connectDB } = require('./services/mongodb');
const { updateDB } = require('./services/update-db');

const app = express();

connectDB();
updateDB();

// Initialize middleware
app.use(express.json({ extended: false }));

// Set port for heroku or local
const PORT = process.env.PORT || 5000;

// Start server
app.listen(PORT, (error) => {
  if (error) throw error;
  console.log(`Listening on port ${PORT}`);
});
