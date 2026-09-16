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

app.set('trust proxy', 1);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

if (!process.env.SESSION_SECRET) {
  console.warn(
    '[WARNING] SESSION_SECRET is not set. Add it in Render Environment Variables.'
  );
}

if (!process.env.ADMIN_PIN) {
  console.warn(
    '[WARNING] ADMIN_PIN is not set. Admin login will not work until it is configured in Render.'
  );
}

app.use(
  session({
    name: 'bcg.sid',
    secret:
      process.env.SESSION_SECRET ||
      'development-secret-change-this-in-render',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: isProd,
      maxAge: 1000 * 60 * 60 * 8
    }
  })
);

app.use('/', publicRoutes);
app.use('/', publicApiRoutes);

app.use('/admin', adminPagesRoutes);
app.use('/admin/api', adminApiRoutes);

app.use((req, res) => {
  res.status(404).send('Page not found');
});

app.use((err, req, res, next) => {
  console.error('[SERVER ERROR]', err);
  res.status(500).send('Internal server error');
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(
    `Bonus Coin Giveaway server running on port ${PORT}`
  );
});
