const mongoose = require('mongoose');
mongoose.Promise = require('bluebird');

const url =
  'mongodb+srv://Enhanzed:qwerty@1@cluster0.x6aq2.mongodb.net/chat?retryWrites=true&w=majority';

const connect = mongoose
  .connect(url, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(res => {
    console.log('database connected');
  })
  .catch(err => {
    console.error(err);
  });

module.exports = connect;
