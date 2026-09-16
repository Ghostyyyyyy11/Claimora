// Minimal in-memory login attempt limiter to slow down brute-force attempts
// against /admin/login. Resets on server restart, which is an acceptable
// trade-off for a small, single-instance deployment.

const attempts = new Map();
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS = 5;

function isLocked(key) {
  const rec = attempts.get(key);
  if (!rec) return false;
  if (Date.now() - rec.first > WINDOW_MS) {
    attempts.delete(key);
    return false;
  }
  return rec.count >= MAX_ATTEMPTS;
}

function recordFailure(key) {
  const rec = attempts.get(key);
  if (!rec || Date.now() - rec.first > WINDOW_MS) {
    attempts.set(key, { count: 1, first: Date.now() });
  } else {
    rec.count += 1;
  }
}

function clear(key) {
  attempts.delete(key);
}

module.exports = { isLocked, recordFailure, clear };
