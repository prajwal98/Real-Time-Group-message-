const app = angular.module('chat-app', ['ngRoute']);

app.config(function ($routeProvider) {
  $routeProvider.when('/', {
    templateUrl: '../chat.html',
    controller: 'chatApp',
  });
});
app.controller('chatApp', function ($scope, $window) {
  $scope.class = 'msg-overlay-list-bubble--is-minimized m14';
  $scope.arrowDown = false;

  $scope.changeClass = function () {
    const { username, room, id } = Qs.parse(location.search, {
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
    console.log(username);
    const socket = io({
      auth: {
        username,
        room,
        id,
      },
    });

    // const sessionID = localStorage.getItem('sessionId');

    // if (sessionID) {
    //   socket.auth = { sessionID };
    //   socket.connect();
    // }

    socket.on('session', ({ sessionID, userID }) => {
      socket.auth = { sessionID };

      // localStorage.setItem('sessionId', sessionID);

      socket.userID = userID;
    });

    console.log(username, room);

    socket.emit('joinRoom', { username, room });
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
        });
      $('scroll-top').scrollTop = $('scroll-top').scrollHeight;
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
      textMsg.focus();
      console.log('1st' + msg);
      msg = msg.trim();

      if (!msg) {
        return false;
      }
      console.log('2nd' + msg);

      socket.emit('chatMessage', msg);
      $scope.obj.msg = '';
      // msg.focus();
    };
    // chatForm.on("submit", (e) => {
    //   let msg = e.target.elements.msg.value;
    //   console.log("1st" + msg);
    //   msg = msg.trim();

    //   if (!msg) {
    //     return false;
    //   }
    //   console.log("2nd" + msg);
    //   socket.emit("chatMessage", msg);

    //   e.target.elements.msg.value = "";
    //   e.target.elements.msg.focus();
    // });

    $scope.outputMessage = function (message) {
      $('.chat-messages').append(`<div class='message'>
        
        <p class='meta'>${message.username} <span>${message.time}</span></p>
        <p class='text'>${message.text}</p>
        </div>`);
      // const div = document.createElement("div");
      // div.classList.add("message");
      // const p = document.createElement("p");
      // p.classList.add("meta");
      // p.innerText = message.username;
      // p.innerHTML += `<span>${message.time}</span>`;
      // div.append(p);
      // const para = document.createElement("p");
      // para.classList.add("text");
      // para.innerText = message.text;
      // div.appendChild(para);
      // $(".chat-messages").append(div);
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

      users.forEach(user => {
        for (let i = 0; i < usersList.length; i++) {
          const existingUser = usersList[i];
          if (existingUser.userID === user.userID) {
            existingUser.connected = user.connected;
            return;
          }
        }
        console.log(socket.userID);
        user.self = user.userID === socket.userID;
        usersList.push(user);
        $scope.outputUsers(usersList);
        // console.log(usersList);
        $scope.$apply();
      });

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
    $scope.outputUsers = function (usersList) {
      usersList.forEach(user => {
        if (user.room === room || user.userID === socket.userID) {
          $('.dropdown-menu').append(
            user.connected
              ? `<li><span class="online"></span><p class='decor'>${user.username}</p></li>`
              : `<li><span class="offline"></span><p class='decor'>${user.username}</p></li>`
          );
          $scope.$apply();
        }
      });
      // usersList.map(user => {
      //   $('.dropdown-menu').append(
      //     `<li><span class="online"></span></span><p class='decor'>${user.username}</p></li>`
      //     // user.connected === true
      //     //   ? `<li><span class="online"></span></span><p class='decor'>${user.username}</p></li>`
      //     //   : `<li><span class="offline"></span></span><p class='decor'>${user.username}</p></li>`
      //   );
      //   $scope.$apply();
      // });
    };
  };

  $scope.changeClass();
});

// (function () {
//   fetch('/chats')
//     .then(data => {
//       return data.json();
//     })
//     .then(json => {
//       json.map(data => {
//         console.log(
//           $('.chat-messages').append(`
//         <div>hi</div>
//         `)
//         );
//       });
//     });
// })();
