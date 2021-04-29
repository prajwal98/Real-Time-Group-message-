const path = require('path');
const http = require('http');
const moment = require('moment');
const express = require('express');
const socketio = require('socket.io');
const bodyParser = require('body-parser');
const chatRouter = require('./routes/chatroute');
const { API } = require('aws-amplify');
const axios = require('axios');
const crypto = require('crypto');

const Amplify = require('aws-amplify');
const randomId = () => crypto.randomBytes(8).toString('hex');

const formatMessage = require('./utils/messages');

const {
  userJoin,
  getCurrentUser,
  userLeave,
  getRoomUsers,
  fetchCategories,
} = require('./utils/users');

const { InMemorySessionStore } = require('./sessionStore');
const sessionStore = new InMemorySessionStore();

const app = express();
const server = http.createServer(app);
const io = socketio(server);

app.use(bodyParser.json());
//routes
app.use('/chats', chatRouter);
// Set static folder
app.use(express.static(path.join(__dirname, 'public')));

// Amplify.configure({
//   // OPTIONAL - if your API requires authentication
//   Auth: {
//     // REQUIRED - Amazon Cognito Identity Pool ID
//     identityPoolId: 'us-east-1:71ec0e53-a9fe-44a7-ab65-23027a0408ad',
//     // REQUIRED - Amazon Cognito Region
//     region: 'us-east-1',
//     // OPTIONAL - Amazon Cognito User Pool ID
//     userPoolId: 'us-east-1_gQYyDz2sa',
//     // OPTIONAL - Amazon Cognito Web Client ID (26-char alphanumeric string)
//     userPoolWebClientId: '2pelocmsrs9rbeblevjla4c473',
//   },
// });

const botName = 'LiveTime Bot';
const Room = require('./model/roomSchema');

//session auth
io.use((socket, next) => {
  const sessionID = socket.handshake.auth.sessionID;
  console.log(sessionID);
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
  console.log(username);
  if (!username) {
    return next(new Error('invalid username'));
  }
  socket.sessionID = randomId();
  socket.userID = randomId();
  socket.room = room;
  next();
});

let client = 0;
// Run when client connects
io.on('connection', socket => {
  //session details
  console.log(socket.sessionID);
  socket.emit('session', {
    sessionID: socket.sessionID,
    userID: socket.userID,
  });

  fetchCategories();
  //Join Room
  socket.on('joinRoom', ({ username, room }) => {
    // persist session
    sessionStore.saveSession(socket.sessionID, {
      userID: socket.userID,
      username: username,
      room: room,
      connected: true,
    });
    // const user = userJoin(socket.id, username, room, true);
    // console.log('user', user);
    const user = sessionStore.findSession(socket.sessionID);
    console.log(user);

    socket.join(user.room);

    // axios
    //   .get('https://randomuser.me/api/')
    //   .then(function (response) {
    //     // handle success
    //     console.log(response.data);
    //   })
    //   .catch(function (error) {
    //     // handle error
    //     console.log(error);
    //   })
    //   .then(function () {
    //     // always executed
    //   });
    // // console.log('res' + response);
    // // // Welcome current user
    socket.emit('message', formatMessage(botName, 'Welcome to livetime!'));
    client++;

    // fetch existing users
    const users = [];

    sessionStore.findAllSessions().forEach(session => {
      users.push({
        userID: session.userID,
        username: session.username,
        connected: session.connected,
      });
      // console.log(users);
    });
    socket.emit('connected user', users);

    // Broadcast when a user connects
    socket.broadcast
      .to(user.room)
      .emit(
        'message',
        formatMessage(botName, `${user.username} has joined the chat`)
      );

    // Send users and room info
    io.to(user.room).emit('roomUsers', {
      room: user.room,
      users: getRoomUsers(user.room),
    });
  });

  // Listen for chatMessage
  socket.on('chatMessage', msg => {
    console.log(msg);
    const user = sessionStore.findSession(socket.sessionID);
    // console.log(msg);
    io.to(user.room).emit('message', formatMessage(user.username, msg));

    console.log(user);
    let chatMessage = new Room({
      message: msg,
      username: user.username,
      room: user.room,
      time: moment().utcOffset('+05:30').format('LT'),
    });

    chatMessage.save(); // save message to database
  });

  // Runs when client disconnects
  socket.on('disconnect', () => {
    // const user = userLeave(socket.id);
    const user = sessionStore.findSession(socket.sessionID);
    // console.log(disUser);

    if (user) {
      io.to(user.room).emit(
        'message',
        formatMessage(botName, `${user.username} has left the chat`)
      );

      // // Send users and room info
      // io.to(user.room).emit('roomUsers', {
      //   room: user.room,
      //   users: getRoomUsers(user.room),
      // });

      sessionStore.saveSession(socket.sessionID, {
        userID: socket.userID,
        username: user.username,
        connected: false,
      });
    }
  });
  // notify users upon disconnection
  // socket.on('disconnect', async () => {
  //   const matchingSockets = await io.in(socket.room).allSockets();
  //   console.log(matchingSockets);
  //   const isDisconnected = matchingSockets.size === 0;
  //   if (isDisconnected) {
  //     // notify other users
  //     socket.broadcast.emit('user disconnected', socket.userID);
  //     // update the connection status of the session
  //     sessionStore.saveSession(socket.sessionID, {
  //       userID: socket.userID,
  //       username: socket.username,
  //       connected: false,
  //     });
  //   }
  // });
});

const PORT = process.env.PORT || 80 || 443 || 3000;

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
