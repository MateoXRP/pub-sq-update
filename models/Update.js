const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const UpdateSchema = new Schema({
  nextEndDate: {
    type: Number,
    required: true
  },
  totalPostsSaved: {
    type: Number,
    default: 0
  },
  totalCommentsSaved: {
    type: Number,
    default: 0
  },
  totalLikesSaved: {
    type: Number,
    default: 0
  },
  lastUpdatedAt: {
    type: Date,
    required: true,
    default: Date.now
  }
});

const Update = mongoose.model('Update', UpdateSchema);

module.exports = { Update };
