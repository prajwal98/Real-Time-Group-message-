const path = require('path');
const http = require('http');
const moment = require('moment');
const express = require('express');
const socketio = require('socket.io');
const bodyParser = require('body-parser');
const chatRouter = require('./routes/chatroute');

const crypto = require('crypto');

const randomId = () => crypto.randomBytes(8).toString('hex');

const formatMessage = require('./utils/messages');

const {
  userJoin,
  getCurrentUser,
  userLeave,
  getRoomUsers,
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

    // Welcome current user
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
});

const PORT = process.env.PORT || 443 || 3000;

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
