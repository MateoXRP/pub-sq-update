const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const Update = new Schema({
  nextEndDate: {
    type: Number,
    required: true
  },
  lastUpdatedAt: {
    type: Date,
    required: true,
    default: Date.now
  }
});

module.exports = { Update };
