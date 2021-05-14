const app = angular.module('chat-app', ['ngRoute']);

app.config(function ($routeProvider) {
  $routeProvider.when('/', {
    templateUrl: '../chat.html',
    controller: 'chatApp',
  });
});

var chatAppCtrl = function ($scope, $crypto) {
  $scope.class = 'msg-overlay-list-bubble--is-minimized m14';
  $scope.arrowDown = false;

  $scope.changeClass = function () {
    const { username, room, id, chatparam } = Qs.parse(location.search, {
      ignoreQueryPrefix: true,
    });

    $scope.arrowDown = false;
    $scope.arrowDown = !$scope.arrowDown;
    if ($scope.class === 'msg-overlay-list-bubble--is-minimized m14') {
      $scope.class = 'msg-overlay-list-bubble m14';
    } else {
      $scope.class = 'msg-overlay-list-bubble--is-minimized m14';
    }

    const roomName = $('#room-name');
    console.log(chatparam);
    // $crypto.decrypt(chatparam, akjcguayb976qsdn1q92y83ehqd23dsa);
    const socket = io({
      auth: {
        username,
        room,
        id,
      },
    });

    // const sessionID = localStorage.getItem('sessionID');

    // if (sessionID) {
    //   socket.auth = { sessionID };
    //   socket.connect();
    // }

    socket.on('session', ({ sessionID, userID }) => {
      socket.auth = { sessionID };

      // localStorage.setItem('sessionID', sessionID);

      socket.userID = userID;
    });

    console.log(username, room);

    socket.emit('joinRoom', { username, room, chatparam });
    $(document).ready(function () {
      fetch('/chats')
        .then(data => {
          return data.json();
        })
        .then(json => {
          function groupByKey(array, key) {
            return array.reduce((hash, obj) => {
              if (obj[key] === undefined) return hash;
              return Object.assign(hash, {
                [obj[key]]: (hash[obj[key]] || []).concat(obj),
              });
            }, {});
          }
          var results = groupByKey(json, 'room');

          // console.log(java);
          var jScript = results[room];

          jScript.map(data => {
            $('.chat-messages').append(`<div class='message'>
        
        <p class='meta'>${data.username} <span>${data.time}</span></p>
        <p class='text'>${data.message}</p>
        </div>`);
          });
          $('#scroll-top').animate(
            { scrollTop: $('#scroll-top')[0].scrollHeight },
            1000
          );
        });
    });
    socket.on('roomUsers', ({ room, users }) => {
      $scope.outputRoomName(room);

      console.log(users);
      // $scope.outputUsers(users);
    });

    socket.on('message', message => {
      console.log(message);
      $scope.outputMessage(message);
      // Scroll down
      let chatMessages = document.getElementById('scroll-top');
      chatMessages.scrollTop = chatMessages.scrollHeight;
    });
    $scope.obj = {};
    $scope.chatForm = function () {
      let msg = $scope.obj.msg;

      let textMsg = document.getElementById('text-msg');

      console.log('1st' + msg);
      msg = msg.trim();

      if (!msg) {
        return false;
      }
      console.log('2nd' + msg);

      socket.emit('chatMessage', { msg, chatparam });
      $scope.obj.msg = '';
      textMsg.focus();
      // msg.focus();
    };

    $scope.outputMessage = function (message) {
      $('.chat-messages').append(`<div class='message'>
        <p class='meta'>${message.username} <span>${message.time}</span></p>
        <p class='text'>${message.text}</p>
        </div>`);
    };

    $scope.outputRoomName = function (room) {
      roomName.innerText = room;
    };
    let usersList = [];

    socket.on('connect', () => {
      usersList.forEach(user => {
        if (user.self) {
          user.connected = true;
        }
        $scope.$apply();
      });
    });

    socket.on('disconnect', () => {
      usersList.forEach(user => {
        if (user.self) {
          user.connected = false;
        }
      });
      $scope.$apply();
    });
    socket.on('users', users => {
      // $scope.outputUsers(users);
      // users.forEach(user => {
      //   console.log(user);
      //   const bool = usersList.find(userL => userL.userID === user.userID);
      //   if (!bool) {
      //     usersList.push(user);
      //   }
      // });
      // $scope.outputUsers(usersList);
      // console.log(users);
      $scope.users = users;
      // $scope.outputUsers(users);
      $scope.$apply();
    });

    socket.on('user connected', user => {
      // console.log(user);

      for (let i = 0; i < usersList.length; i++) {
        const existingUsers = usersList[i];
        if (existingUsers.userID === user.userID) {
          existingUsers.connected = true;
          return;
        }
      }
      // console.log(user);
      usersList.push(user);
      console.log(usersList);
      $scope.outputUsers(usersList);
      $scope.$apply();
    });

    socket.on('user disconnected', id => {
      for (let i = 0; i < usersList.length; i++) {
        const user = usersList[i];
        if (user.userID === id) {
          user.connected = false;
          break;
        }
      }
      // usersList.push(user);
      $scope.outputUsers(usersList);
      $scope.$apply();
    });
    // $scope.outputUsers = function (usersList) {
    //   usersList.forEach(user => {
    //     if (user.UNAME !== undefined && user.UNAME) {
    //       $('.dropdown-menu').append(
    //         `<li>
    //         <div class='flex'>
    //         <span class="users"></span><p class='paraG'>${user.UNAME}</p>
    //         </div>
    //         </li>`
    //       );
    //     } else if (user.username) {
    //       $('.dropdown-menu').append(
    //         `<li>
    //         <div class='flex'>
    //         <span class="users"></span><p class='paraG'>${user.username}</p>
    //         </div>
    //         </li>`
    //       );
    //     }
    //     $scope.$apply();
    //   });
    // };
  };

  $scope.changeClass();
};
app.controller('chatApp', chatAppCtrl);

chatAppCtrl.$inject = ['$scope'];
