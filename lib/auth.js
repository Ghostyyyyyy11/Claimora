function checkCredentials(pin) {
  const adminPin = process.env.ADMIN_PIN;

  if (!adminPin) {
    console.error('[auth] ADMIN_PIN is not configured.');
    return false;
  }

  if (typeof pin !== 'string') return false;

  return pin === adminPin;
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
      return res.status(403).json({
        error: 'Invalid or expired session. Please refresh the page and try again.'
      });
    }
  }

  return next();
}

module.exports = {
  checkCredentials,
  requireAuthPage,
  requireAuthApi
};
