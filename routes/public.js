const express = require('express');
const router = express.Router();
const { readData } = require('../lib/db');

router.get('/', (req, res) => {
  const data = readData();
  res.render('home', { welcomeMessage: data.settings.welcomeMessage });
});

router.get('/rewards', (req, res) => {
  res.render('rewards', {});
});

module.exports = router;
