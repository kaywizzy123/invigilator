import db from "./db.js";

// How many wrong passwords are allowed in a window of time before logins pause.
const WINDOW_MINUTES = 15;
const MAX_FAILURES_PER_EMAIL = 5;
// Set high on purpose: a whole school often shares one internet address.
const MAX_FAILURES_PER_IP = 50;

const insertFailure = db.prepare(`
  INSERT INTO login_failures (email, ip, failed_at) VALUES (?, ?, ?)
`);

// The number of recent failures, and when the oldest of them happened.
const recentForEmail = db.prepare(`
  SELECT COUNT(*) AS count, MIN(failed_at) AS oldest
  FROM login_failures
  WHERE email = ? AND failed_at > ?
`);

const recentForIp = db.prepare(`
  SELECT COUNT(*) AS count, MIN(failed_at) AS oldest
  FROM login_failures
  WHERE ip = ? AND failed_at > ?
`);

const deleteForEmail = db.prepare(`DELETE FROM login_failures WHERE email = ?`);

const deleteOld = db.prepare(`DELETE FROM login_failures WHERE failed_at <= ?`);

function windowStart() {
  return new Date(Date.now() - WINDOW_MINUTES * 60 * 1000).toISOString();
}

// Minutes until the oldest failure drops out of the window, which frees up one more try.
function minutesUntilFree(oldest) {
  const freeAt = new Date(oldest).getTime() + WINDOW_MINUTES * 60 * 1000;
  return Math.max(1, Math.ceil((freeAt - Date.now()) / 60000));
}

// Returns null if this email and computer may try a password now,
// or the number of minutes to wait if there have been too many failures.
export function loginWaitMinutes(email, ip) {
  const since = windowStart();
  const byEmail = recentForEmail.get(email, since);
  if (byEmail.count >= MAX_FAILURES_PER_EMAIL) return minutesUntilFree(byEmail.oldest);
  const byIp = recentForIp.get(ip, since);
  if (byIp.count >= MAX_FAILURES_PER_IP) return minutesUntilFree(byIp.oldest);
  return null;
}

export function recordLoginFailure(email, ip) {
  insertFailure.run(email, ip, new Date().toISOString());
  // Tidy up: failures older than the window no longer matter.
  deleteOld.run(windowStart());
}

// After a correct password, that email starts again with a clean slate.
export function clearLoginFailures(email) {
  deleteForEmail.run(email);
}

export function tooManyAttemptsMessage(minutes) {
  return `Too many wrong passwords. For your security, please wait ${minutes} ${minutes === 1 ? "minute" : "minutes"} and try again.`;
}
