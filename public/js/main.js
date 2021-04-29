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
    const { username, room } = Qs.parse(location.search, {
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
      },
    });

    const sessionID = localStorage.getItem('sessionID');

    if (sessionID) {
      socket.auth = { sessionID };
      socket.connect();
    }

    socket.on('session', ({ sessionID, userID }) => {
      socket.auth = { sessionID };

      localStorage.setItem('sessionID', sessionID);

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
    socket.on('connected user', users => {
      // $scope.outputUsers(users);
      users.forEach(user => {
        console.log(user);
        const bool = usersList.find(userL => userL.userID === user.userID);
        if (!bool) {
          usersList.push(user);
        }
      });
      $scope.outputUsers(usersList);
    });

    socket.on('user disconnected', id => {
      for (let i = 0; i < $scope.users.length; i++) {
        const user = $scope.users[i];
        if (user.userID === id) {
          user.connected = false;
          break;
        }
      }
      $scope.$apply();
    });
    $scope.outputUsers = function (usersList) {
      usersList.map(user => {
        $('.dropdown-menu').append(
          user.connected === true
            ? `<li><span class="online"></span></span><p class='decor'>${user.username}</p></li>`
            : `<li><span class="offline"></span></span><p class='decor'>${user.username}</p></li>`
        );
        $scope.$apply();
      });
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
