const bcrypt = require('bcryptjs');

function checkCredentials(username, password) {
  const validUsername = process.env.ADMIN_USERNAME;
  const validHash = process.env.ADMIN_PASSWORD_HASH;

  if (!validUsername || !validHash) {
    console.error(
      '[auth] ADMIN_USERNAME / ADMIN_PASSWORD_HASH are not configured. Set them as environment variables.'
    );
    return false;
  }
  if (typeof username !== 'string' || typeof password !== 'string') return false;
  if (username !== validUsername) return false;

  try {
    return bcrypt.compareSync(password, validHash);
  } catch (e) {
    console.error('[auth] Failed to compare password hash:', e.message);
    return false;
  }
}

function requireAuthPage(req, res, next) {
  if (req.session && req.session.isAdmin) return next();
  return res.redirect('/admin/login');
}

function requireAuthApi(req, res, next) {
  if (!req.session || !req.session.isAdmin) {
    return res.status(401).json({ error: 'Not authenticated.' });
  }
  if (['POST', 'PUT', 'DELETE'].includes(req.method)) {
    const token = req.headers['x-csrf-token'];
    if (!token || token !== req.session.csrfToken) {
      return res.status(403).json({ error: 'Invalid or expired session. Please refresh the page and try again.' });
    }
  }
  return next();
}

module.exports = { checkCredentials, requireAuthPage, requireAuthApi };
