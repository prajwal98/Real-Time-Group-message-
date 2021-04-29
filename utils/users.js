const { API } = require('aws-amplify');

const users = [];

// Join user to chat
function userJoin(id, username, room, connected) {
  const user = { id, username, room, connected };

  users.push(user);

  return user;
}

// Get current user
function getCurrentUser(id) {
  return users.find(user => user.id === id);
}

// User leaves chat
function userLeave(id) {
  const index = users.findIndex(user => user.id === id);

  if (index !== -1) {
    return (users[index].connected = false);
    // return users.splice(index, 1)[0];
  }
}

// Get room users
function getRoomUsers(room) {
  return users.filter(user => user.room === room);
}

async function fetchCategories() {
  const bodyParam = {
    body: {
      users: ['3936ce51-8d38-46f4-ae75-9d101aa383a1'],
      msg: 'test 4',
      title: 'test 4',
      oid: 'CASEBOX',
      read: 0,
      tenant: 'CASEBOX-EXCELSOFT',
      type: 1,
    },
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  };
  try {
    const response = await API.post(
      'CB-PRODAUTH1296',
      '/sendPushNotification',
      bodyParam
      //`${Constants.GET_MY_PROGRAMS}`, bodyParam,
    );
    const categoriesJSON = response;
    return categoriesJSON;
    // setApi(categoriesJSON);
    // console.log('api', bpid);
    // categoriesJSON = JSON.parse(categoriesJSON);
  } catch (error) {
    console.log('getCategoryError', error);
  }
}

module.exports = {
  userJoin,
  getCurrentUser,
  userLeave,
  getRoomUsers,
  fetchCategories,
};
