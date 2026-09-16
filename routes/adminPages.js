const express = require('express');
const router = express.Router();
const crypto = require('crypto');

const { readData } = require('../lib/db');
const {
  checkCredentials,
  requireAuthPage
} = require('../lib/auth');

const loginLimiter = require('../lib/loginLimiter');

// Display admin login page
router.get('/login', (req, res) => {
  if (req.session && req.session.isAdmin) {
    return res.redirect('/admin');
  }

  return res.render('admin-login', {
    error: null
  });
});

// Process admin PIN login
router.post('/login', (req, res) => {
  const key = req.ip;
  const pin = req.body ? req.body.pin : '';

  if (loginLimiter.isLocked(key)) {
    return res.status(429).render('admin-login', {
      error: 'Too many failed attempts. Please try again in 15 minutes.'
    });
  }

  if (!checkCredentials(pin)) {
    loginLimiter.recordFailure(key);

    return res.status(401).render('admin-login', {
      error: 'Invalid PIN.'
    });
  }

  loginLimiter.clear(key);

  return req.session.regenerate(err => {
    if (err) {
      console.error('[admin-login] Session error:', err);

      return res.status(500).render('admin-login', {
        error: 'Something went wrong. Please try again.'
      });
    }

    req.session.isAdmin = true;
    req.session.csrfToken = crypto.randomBytes(24).toString('hex');

    return res.redirect('/admin');
  });
});

// Admin logout
router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/admin/login');
  });
});

// Admin dashboard
router.get('/', requireAuthPage, (req, res) => {
  const data = readData();

  return res.render('admin-dashboard', {
    csrfToken: req.session.csrfToken,
    initialData: JSON.stringify(data)
  });
});

module.exports = router;
