const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { readData } = require('../lib/db');
const { checkCredentials, requireAuthPage } = require('../lib/auth');
const loginLimiter = require('../lib/loginLimiter');

router.post('/login', (req, res) => {
  const key = req.ip;

  if (loginLimiter.isLocked(key)) {
    return res
      .status(429)
      .render('admin-login', {
        error: 'Too many failed attempts. Please try again in 15 minutes.'
      });
  }

  const { pin } = req.body;

  if (checkCredentials(pin)) {
    loginLimiter.clear(key);

    req.session.regenerate(err => {
      if (err) {
        return res
          .status(500)
          .render('admin-login', {
            error: 'Something went wrong. Please try again.'
          });
      }

      req.session.isAdmin = true;
      req.session.csrfToken = crypto.randomBytes(24).toString('hex');

      res.redirect('/admin');
    });
  } else {
    loginLimiter.recordFailure(key);

    res
      .status(401)
      .render('admin-login', {
        error: 'Invalid PIN.'
      });
  }
});
router.post('/login', (req, res) => {
  const key = req.ip;

  if (loginLimiter.isLocked(key)) {
    return res
      .status(429)
      .render('admin-login', { error: 'Too many failed attempts. Please try again in 15 minutes.' });
  }

  const { username, password } = req.body;

  if (checkCredentials(username, password)) {
    loginLimiter.clear(key);
    req.session.regenerate(err => {
      if (err) {
        return res.status(500).render('admin-login', { error: 'Something went wrong. Please try again.' });
      }
      req.session.isAdmin = true;
      req.session.csrfToken = crypto.randomBytes(24).toString('hex');
      res.redirect('/admin');
    });
  } else {
    loginLimiter.recordFailure(key);
    res.status(401).render('admin-login', { error: 'Invalid username or password.' });
  }
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/admin/login');
  });
});

router.get('/', requireAuthPage, (req, res) => {
  const data = readData();
  res.render('admin-dashboard', {
    csrfToken: req.session.csrfToken,
    initialData: JSON.stringify(data)
  });
});

module.exports = router;
