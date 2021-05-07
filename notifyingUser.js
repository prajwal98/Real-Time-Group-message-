/* abstract */
class notifyingUser {
  findSession(id) {}
  saveSession(id, notifyingBody) {}
  findAllSessions() {}
}

class InMemoryNotifyingUser extends notifyingUser {
  constructor() {
    super();
    this.notifications = [];
  }

  saveNotifications(notifyingBody) {
    this.notifications.push(notifyingBody);
  }
}

module.exports = {
  InMemoryNotifyingUser,
};
