const express = require('express');
const bodyParser = require('body-parser');
const connectdb = require('../dbconnect');
const Rooms = require('../model/roomSchema');

const router = express.Router();

router.route('/').get((req, res, next) => {
  res.setHeader('Content-Type', 'application/json');
  res.statusCode = 200;

  connectdb.then(db => {
    let data = Rooms.find({ message: 'Javascript' });
    Rooms.find({}).then(room => {
      res.send(room);
    });
  });
});

module.exports = router;
