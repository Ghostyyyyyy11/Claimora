require('dotenv').config();

const express = require('express');
const session = require('express-session');
const path = require('path');

const publicRoutes = require('./routes/public');
const publicApiRoutes = require('./routes/publicApi');
const adminPagesRoutes = require('./routes/adminPages');
const adminApiRoutes = require('./routes/adminApi');

const app = express();
const isProd = process.env.NODE_ENV === 'production';

// Render sits behind a proxy; this lets secure cookies work correctly.
app.set('trust proxy', 1);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

if (!process.env.SESSION_SECRET) {
  console.warn(
    '[WARNING] SESSION_SECRET is not set. Using an insecure default. Set a real SESSION_SECRET in production.'
  );
}
if (!process.env.ADMIN_USERNAME || !process.env.ADMIN_PASSWORD_HASH) {
  console.warn(
    '[WARNING] ADMIN_USERNAME / ADMIN_PASSWORD_HASH are not set. The /admin login will not work until they are configured. See README.md.'
  );
}

app.use(
  session({
    name: 'bcg.sid',
    secret: process.env.SESSION_SECRET || 'dev-insecure-secret-change-me',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: isProd,
      maxAge: 1000 * 60 * 60 * 8 // 8 hours
    }
  })
);

// Public site
app.use('/', publicRoutes);
app.use('/', publicApiRoutes);

// Admin (separate area, not linked from public pages)
app.use('/admin', adminPagesRoutes);
app.use('/admin/api', adminApiRoutes);

app.use((req, res) => {
  res.status(404).send('Page not found');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Bonus Coin Giveaway server running on port ${PORT}`);
});
