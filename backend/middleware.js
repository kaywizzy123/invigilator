import { SESSION_COOKIE, getSessionUserId } from "./sessions.js";
import { findUserById } from "./users.js";

// Looks up the user from the session cookie and saves it as req.user. Returns false
// (after replying 401) if nobody is logged in.
async function loadUser(req, res) {
  const userId = getSessionUserId(req.cookies[SESSION_COOKIE]);
  const user = userId && (await findUserById(userId));
  if (!user) {
    res.status(401).json({ error: "Not logged in." });
    return false;
  }
  req.user = user;
  return true;
}

// Put in front of any route that needs a logged-in user.
// Someone still on a temporary password (from a teacher's reset) is refused until they
// choose their own: the teacher knows the temporary one.
export async function requireAuth(req, res, next) {
  if (!(await loadUser(req, res))) return;
  if (req.user.mustChangePassword) {
    return res.status(403).json({ error: "Choose a new password first.", mustChangePassword: true });
  }
  next();
}

// Like requireAuth, but also lets in someone on a temporary password.
// Only for the routes they need to choose a new one.
export async function requireAuthAllowingTemporaryPassword(req, res, next) {
  if (!(await loadUser(req, res))) return;
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
