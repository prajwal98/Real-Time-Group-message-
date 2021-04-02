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
    $(document).ready(function () {
      const roomName = $("#room-name");

      const userList = $("#users");
      const chatMessages = $(".chat-messages");
      const chatForm = $("#chat-form");
      const socket = io();

      console.log(username, room);

      socket.emit("joinRoom", { username, room });

      socket.on("roomUsers", ({ room, users }) => {
        outputRoomName(room);
        outputUsers(users);
      });

      socket.on("message", (message) => {
        console.log(message);
        outputMessage(message);

        chatMessages.scrollTop = chatMessages.scrollHeight;
      });

      chatForm.on("submit", (e) => {
        e.preventDefault();

        let msg = e.target.elements.msg.value;

        msg = msg.trim();

        if (!msg) {
          return false;
        }

        socket.emit("chatMessage", msg);

        e.target.elements.msg.value = "";
        e.target.elements.msg.focus();
      });

      function outputMessage(message) {
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
      }

      function outputRoomName(room) {
        roomName.innerText = room;
      }

      function outputUsers(users) {
        userList.innerHTML = "";
        users.forEach((user) => {
          userList.append(`<li>${user.username}</li>`);
          //   const li = document.createElement("li");
          //   li.innerText = user.username;
          //   userList.appendChild(li);
        });
      }
    });
  };
  $scope.changeClass();
});
