const moment = require('moment');

function formatMessage(username, text) {
  return {
    username,
    text,
    time: moment().utcOffset('+5:30').format('LT'),
  };
}

module.exports = formatMessage;
