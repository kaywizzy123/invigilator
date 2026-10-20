import { randomBytes } from "node:crypto";
import db from "./db.js";

const SESSION_DAYS = 7;
export const SESSION_COOKIE = "sid";
export const SESSION_MAX_AGE = SESSION_DAYS * 24 * 60 * 60 * 1000;

const insertSession = db.prepare(`
  INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)
`);

const findSession = db.prepare(`
  SELECT user_id AS userId, expires_at AS expiresAt FROM sessions WHERE id = ?
`);

const removeSession = db.prepare(`DELETE FROM sessions WHERE id = ?`);

const removeAllSessions = db.prepare(`DELETE FROM sessions WHERE user_id = ?`);

const removeOtherSessions = db.prepare(`DELETE FROM sessions WHERE user_id = ? AND id != ?`);

export function createSession(userId) {
  const id = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE).toISOString();
  insertSession.run(id, userId, expiresAt);
  return id;
}

// Returns the user ID for a valid session, or null if it's missing or expired.
export function getSessionUserId(id) {
  if (!id) return null;
  const session = findSession.get(id);
  if (!session) return null;
  if (new Date(session.expiresAt) < new Date()) {
    removeSession.run(id);
    return null;
  }
  return session.userId;
}

export function deleteSession(id) {
  if (id) removeSession.run(id);
}

// Logs the user out everywhere except the session they're using now.
export function deleteOtherSessions(userId, keepSessionId) {
  removeOtherSessions.run(userId, keepSessionId);
}

// Logs the user out on every device.
export function deleteAllSessions(userId) {
  removeAllSessions.run(userId);
}
