const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const roomSchema = new Schema({
  userID: {
    type: String,
  },
  message: {
    type: String,
  },
  username: {
    type: String,
  },
  room: {
    type: String,
  },
  time: {
    type: String,
  },
});

module.exports = mongoose.model('Room', roomSchema);
