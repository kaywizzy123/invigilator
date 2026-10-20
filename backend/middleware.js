import { SESSION_COOKIE, getSessionUserId } from "./sessions.js";
import { findUserById } from "./users.js";

// Put in front of any route that needs a logged-in user.
// Looks up the user from the session cookie and saves it as req.user.
export async function requireAuth(req, res, next) {
  const userId = getSessionUserId(req.cookies[SESSION_COOKIE]);
  const user = userId && (await findUserById(userId));
  if (!user) {
    return res.status(401).json({ error: "Not logged in." });
  }
  req.user = user;
  next();
}

// Put after requireAuth on routes only students may use.
export function requireStudent(req, res, next) {
  if (req.user.role !== "student") {
    return res.status(403).json({ error: "Only students can do that." });
  }
  next();
}

// Put after requireAuth on routes only teachers may use.
export function requireTeacher(req, res, next) {
  if (req.user.role !== "teacher") {
    return res.status(403).json({ error: "Only teachers can do that." });
  }
  next();
}
