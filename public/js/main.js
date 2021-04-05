const app = angular.module("chat-app", ["ngRoute"]);

app.config(function ($routeProvider) {
  $routeProvider.when("/", {
    templateUrl: "../chat.html",
    controller: "chatApp",
  });
});
app.controller("chatApp", function ($scope) {
  $scope.class = "msg-overlay-list-bubble--is-minimized m14";
  $scope.arrowDown = false;

  $scope.changeClass = function () {
    const { username, room } = Qs.parse(location.search, {
      ignoreQueryPrefix: true,
    });

    $scope.arrowDown = false;
    $scope.arrowDown = !$scope.arrowDown;
    if ($scope.class === "msg-overlay-list-bubble--is-minimized m14") {
      $scope.class = "msg-overlay-list-bubble m14";
    } else {
      $scope.class = "msg-overlay-list-bubble--is-minimized m14";
    }

    const roomName = $("#room-name");

    const chatMessages = $(".chat-messages");
    const socket = io();
    console.log(chatMessages);
    console.log(username, room);

    socket.emit("joinRoom", { username, room });

    socket.on("roomUsers", ({ room, users }) => {
      $scope.outputRoomName(room);
      $scope.outputUsers(users);
    });

    socket.on("message", (message) => {
      console.log(message);
      $scope.outputMessage(message);

      chatMessages.scrollTop = chatMessages.scrollHeight;
    });
    $scope.obj = {};
    $scope.chatForm = function () {
      let msg = $scope.obj.msg;
      socket.emit("chatMessage", msg);
      $scope.obj.msg = "";
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
      $(".chat-messages").append(`<div class='message'>
        
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

    $scope.outputUsers = function (users) {
      users.map((user) => {
        $(".dropdown-menu").append(
          `<li><a class="dropdown-item" href="#">${user.username}</a></li>`
        );
      });
    };
  };
  $scope.changeClass();
});
