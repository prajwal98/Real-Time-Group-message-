const moment = require('moment');

function formatMessage(username, text) {
  return {
    username,
    text,
    time: moment().utcOffset('+05:30').format('MMMM Do YYYY, LT'),
  };
}

module.exports = formatMessage;
