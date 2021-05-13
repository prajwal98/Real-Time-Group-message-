const path = require('path');
const http = require('http');
const moment = require('moment');
const express = require('express');
const socketio = require('socket.io');
const request = require('request');
const bodyParser = require('body-parser');
const chatRouter = require('./routes/chatroute');
const CryptoJS = require('crypto-js');

const crypto = require('crypto');

const randomId = () => crypto.randomBytes(8).toString('hex');

const formatMessage = require('./utils/messages');

const fetchNotification = require('./api');

const {
  userJoin,
  getCurrentUser,
  userLeave,
  getRoomUsers,
} = require('./utils/users');

const { InMemorySessionStore } = require('./sessionStore');
const sessionStore = new InMemorySessionStore();
const { InMemoryNotifyingUser } = require('./notifyingUser');
const NotificationStore = new InMemoryNotifyingUser();

const app = express();
const server = http.createServer(app);
const io = socketio(server);

app.use(bodyParser.json());
//routes
app.use('/chats', chatRouter);
// Set static folder
app.use(express.static(path.join(__dirname, 'public')));

const botName = 'LiveTime Bot';
const Room = require('./model/roomSchema');
const { notify } = require('./routes/chatroute');

//session auth
io.use((socket, next) => {
  const sessionID = socket.handshake.auth.sessionID;
  // console.log(sessionID);
  if (sessionID) {
    const session = sessionStore.findSession(sessionID);
    // console.log(session);
    if (session) {
      socket.sessionID = sessionID;
      socket.userID = session.userID;
      return next();
    }
  }
  const username = socket.handshake.auth.username;
  const room = socket.handshake.auth.room;
  const uniqueUID = socket.handshake.auth.id;
  // console.log(username);
  if (!username) {
    return next(new Error('invalid username'));
  }
  socket.sessionID = uniqueUID;
  socket.userID = randomId();
  socket.room = room;
  socket.username = username;
  next();
});

// Run when client connects
io.on('connection', socket => {
  //session details
  // console.log(socket.sessionID);
  socket.emit('session', {
    sessionID: socket.sessionID,
    userID: socket.userID,
  });

  //Join Room
  socket.on('joinRoom', ({ username, room, chatparam }) => {
    // persist session
    sessionStore.saveSession(socket.sessionID, {
      userID: socket.userID,
      username: username,
      room: room,
      connected: true,
    });

    let chat = chatparam.replace(/\s/g, '+');

    var bytes = CryptoJS.AES.decrypt(
      chat,
      '1234567890qwertyuiopasdfghjklzxcvbnm'
    );

    var decryptedData = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
    console.log(decryptedData);

    var options = {
      method: 'POST',
      url: 'https://qvymg02fy7.execute-api.us-east-1.amazonaws.com/CB-PRODAUTH1296/getGroupUserList',
      headers: {
        'cache-control': 'no-cache',
        'content-type': 'application/json',
        accept: 'application/json',
      },
      body: {
        oid: 'CASEBOX',
        tenant: 'CASEBOX-EXCELSOFT',
        clid: decryptedData.clid,
        gid: decryptedData.gid,
        cid: decryptedData.cid,
      },
      json: true,
    };
    if (decryptedData.gname !== 'Individual') {
      request(options, function (error, response, body) {
        if (error) throw new Error(error);
        if (body) {
          console.log(body.users);
          socket.emit('users', body.users);
        } else {
          console.log(`UsersList is ${body}`);
        }
      });
    } else {
      const users = [];

      sessionStore.findAllSessions().forEach(session => {
        users.push({
          userID: session.userID,
          username: session.username,
          room: session.room,
          connected: session.connected,
        });
      });
      socket.emit('users', users);
      console.log(users);
    }
    // fetch existing users

    // console.log(users);
    // const user = userJoin(socket.id, username, room, true);
    // console.log('user', user);
    const user = sessionStore.findSession(socket.sessionID);
    // console.log(user);

    socket.join(user.room);

    // Welcome current user
    socket.emit('message', formatMessage(botName, 'Welcome to livetime!'));

    // Broadcast when a user connects
    socket.broadcast
      .to(user.room)
      .emit(
        'message',
        formatMessage(botName, `${user.username} has joined the chat`)
      );

    // notify existing users
    socket.broadcast.emit('user connected', {
      userID: socket.userID,
      username: username,
      room: room,
      connected: true,
    });
    // const roomUsers = users.filter(user => user.room === room);

    // Send users and room info
    socket
      .to(user.userID)
      .to(user.room)
      .emit('roomUsers', {
        room: user.room,
        users: getRoomUsers(user.room),
      });
  });

  // Listen for chatMessage
  socket.on('chatMessage', msg => {
    // console.log(msg);
    const user = sessionStore.findSession(socket.sessionID);
    // console.log(msg);

    // NotificationStore.saveNotifications({
    //   room: socket.room,
    //   uniqueUID: socket.sessionID,
    //   msg: msg,
    // });
    // const notifications = NotificationStore.notifications.filter(
    //   notify => notify.room === socket.room
    // );

    // function groupByKey(array, key) {
    //   return array.reduce((hash, obj) => {
    //     if (obj[key] === undefined) return hash;
    //     return Object.assign(hash, {
    //       [obj[key]]: (hash[obj[key]] || []).concat(obj),
    //     });
    //   }, {});
    // }
    // const results = groupByKey(notifications, 'room');
    // // console.log(results);
    // var userIds = results[socket.room];
    // const usersArr = [];
    // userIds.forEach(res => {
    //   if (res.uniqueUID !== socket.sessionID) {
    //     if (!usersArr.includes(res.uniqueUID)) {
    //       usersArr.push(res.uniqueUID);
    //     }
    //   }
    // });
    // // console.log(usersArr);
    // console.log(notify);

    let chat = msg.chatparam.replace(/\s/g, '+');

    var bytes = CryptoJS.AES.decrypt(
      chat,
      '1234567890qwertyuiopasdfghjklzxcvbnm'
    );

    var decryptedData = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
    console.log(decryptedData);

    if (decryptedData.gname !== 'Individual') {
      var options = {
        method: 'POST',
        url: 'https://qvymg02fy7.execute-api.us-east-1.amazonaws.com/CB-PRODAUTH1296/getGroupUserList',
        headers: {
          'cache-control': 'no-cache',
          'content-type': 'application/json',
          accept: 'application/json',
        },
        body: {
          oid: 'CASEBOX',
          tenant: 'CASEBOX-EXCELSOFT',
          clid: decryptedData.clid,
          gid: decryptedData.gid,
          cid: decryptedData.cid,
        },
        json: true,
      };

      console.log(msg);

      request(options, function (error, response, body) {
        if (error) throw new Error(error);
        let usersArray = [];
        if (body.users !== null) {
          body.users.forEach(user => {
            if (user.EID !== socket.sessionID) {
              if (!usersArray.includes(user.EID)) {
                usersArray.push(user.EID);
              }
            }
          });
          if (decryptedData.teid !== undefined) {
            usersArray.push(decryptedData.teid);
          }
          fetchNotification(usersArray, msg.msg, decryptedData.gname);
        }

        console.log(usersArray);
      });
    } else if (decryptedData.type === 'student') {
      let usersArray = [];
      if (decryptedData.teid !== undefined) {
        usersArray.push(decryptedData.teid);
      }
      fetchNotification(usersArray, msg.msg, decryptedData.gname);
    } else if (decryptedData.type === 'Teacher') {
      let usersArray = [];
      if (decryptedData.room !== undefined) {
        usersArray.push(decryptedData.room);
      }
      fetchNotification(usersArray, msg.msg, decryptedData.gname);
    }

    io.to(user.room).emit('message', formatMessage(user.username, msg.msg));

    // console.log(user);
    let chatMessage = new Room({
      message: msg.msg,
      username: user.username,
      room: user.room,
      time: moment().utcOffset('+05:30').format('LT'),
    });

    chatMessage.save(); // save message to database
  });

  // Runs when client disconnects
  socket.on('disconnect', async () => {
    const matchingSockets = await io.in(socket.userID).allSockets();
    console.log(matchingSockets);
    const isDisconnected = matchingSockets.size === 0;
    // const user = userLeave(socket.id);
    const user = sessionStore.findSession(socket.sessionID);
    // console.log(disUser);

    if (isDisconnected) {
      io.to(user.room).emit(
        'message',
        formatMessage(botName, `${user.username} has left the chat`)
      );

      // // Send users and room info
      // io.to(user.room).emit('roomUsers', {
      //   room: user.room,
      //   users: getRoomUsers(user.room),
      // });
      socket.broadcast.emit('user disconnected', socket.userID);

      // sessionStore.saveSession(socket.sessionID, {
      //   userID: socket.userID,
      //   username: user.username,
      //   room: socket.room,
      //   connected: false,
      // });
    }
  });
});

const PORT = process.env.PORT || 80 || 443 || 3000;

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// nohup node server.js &s
// ps -ef |grep "node"
// kill
