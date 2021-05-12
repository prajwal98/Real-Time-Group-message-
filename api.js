const request = require('request');
function fetchNotification(usersArray, msg, room) {
  var options = {
    method: 'POST',
    url: 'https://qvymg02fy7.execute-api.us-east-1.amazonaws.com/CB-PRODAUTH1296/sendPushNotification',
    headers: {
      'cache-control': 'no-cache',
      'content-type': 'application/json',
      accept: 'application/json',
    },
    body: {
      users: usersArray,
      msg: msg,
      title: room,
      oid: 'CASEBOX',
      read: 0,
      tenant: 'CASEBOX-EXCELSOFT',
      type: 1,
    },
    json: true,
  };
  request(options, function (error, response, body) {
    if (error) throw new Error(error);
    console.log(body);
  });
}

module.exports = fetchNotification;
