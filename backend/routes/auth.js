import { Router } from "express";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  createSession,
  deleteAllSessions,
  deleteOtherSessions,
  deleteSession,
} from "../sessions.js";
import {
  changeUserPassword,
  checkLogin,
  createUser,
  findUserByEmail,
  findUserById,
  setOwnPassword,
  updateUserDetails,
} from "../users.js";
import {
  clearLoginFailures,
  loginWaitMinutes,
  recordLoginFailure,
  tooManyAttemptsMessage,
} from "../loginLimits.js";
import { requireAuth, requireAuthAllowingTemporaryPassword } from "../middleware.js";

const router = Router();

// Never send the password hash back to the browser.
function publicUser(user) {
  return {
    id: user.id,
    email: user.email,
    fullname: user.fullname,
    role: user.role,
    createdAt: user.createdAt,
    mustChangePassword: Boolean(user.mustChangePassword),
  };
}

// Start a session and give the browser its cookie. Used by both signup and login.
function logIn(res, user) {
  const sessionId = createSession(user.id);
  res.cookie(SESSION_COOKIE, sessionId, {
    httpOnly: true, // JavaScript in the browser can't read it
    sameSite: "lax", // not sent on requests from other sites
    secure: process.env.NODE_ENV === "production", // HTTPS only in production
    maxAge: SESSION_MAX_AGE,
  });
}

router.post("/signup", async (req, res) => {
  const fullname = String(req.body.fullname ?? "").trim();
  const email = String(req.body.email ?? "").trim().toLowerCase();
  const password = String(req.body.password ?? "");
  const teacherCode = String(req.body.teacherCode ?? "").trim();

  if (!fullname || !email.includes("@") || password.length < 6) {
    return res.status(400).json({ error: "Enter your full name, a valid email and a password of at least 6 characters." });
  }
  if (await findUserByEmail(email)) {
    return res.status(409).json({ error: "An account with that email already exists." });
  }

  // No code means a student account. A code must match TEACHER_CODE from .env;
  // if TEACHER_CODE isn't set, nobody can become a teacher.
  let role = "student";
  if (teacherCode) {
    if (!process.env.TEACHER_CODE || teacherCode !== process.env.TEACHER_CODE) {
      return res.status(403).json({ error: "That teacher code isn't right. Leave it empty to sign up as a student." });
    }
    role = "teacher";
  }

  const user = await createUser(email, password, fullname, role);
  logIn(res, user);
  res.status(201).json({ user: publicUser(user) });
});

router.post("/login", async (req, res) => {
  const email = String(req.body.email ?? "").trim().toLowerCase();
  const password = String(req.body.password ?? "");

  // Checked before the password, so a locked account stays locked even if the next guess is right.
  const waitMinutes = loginWaitMinutes(email, req.ip);
  if (waitMinutes) {
    res.set("Retry-After", String(waitMinutes * 60));
    return res.status(429).json({ error: tooManyAttemptsMessage(waitMinutes) });
  }

  const user = await checkLogin(email, password);
  if (!user) {
    recordLoginFailure(email, req.ip);
    return res.status(401).json({ error: "Incorrect email or password." });
  }

  clearLoginFailures(email);
  logIn(res, user);
  res.json({ user: publicUser(user) });
});

// Works on a temporary password too, so the page knows to ask for a new one.
router.get("/me", requireAuthAllowingTemporaryPassword, (req, res) => {
  res.json({ user: publicUser(req.user) });
});

// Choose your own password after a teacher's reset. No current password needed: you've
// just logged in with the temporary one.
router.put("/me/new-password", requireAuthAllowingTemporaryPassword, async (req, res) => {
  if (!req.user.mustChangePassword) {
    return res.status(409).json({ error: "Use Change password on your profile instead." });
  }
  const newPassword = String(req.body.newPassword ?? "");
  if (newPassword.length < 6) {
    return res.status(400).json({ error: "Your new password must be at least 6 characters." });
  }

  await setOwnPassword(req.user.id, newPassword);
  deleteOtherSessions(req.user.id, req.cookies[SESSION_COOKIE]);
  res.json({ user: publicUser(await findUserById(req.user.id)) });
});

// Update your own name and email. Role can't be changed here.
router.put("/me", requireAuth, async (req, res) => {
  const fullname = String(req.body.fullname ?? "").trim();
  const email = String(req.body.email ?? "").trim().toLowerCase();

  if (!fullname || !email.includes("@")) {
    return res.status(400).json({ error: "Enter your full name and a valid email." });
  }
  const existing = await findUserByEmail(email);
  if (existing && existing.id !== req.user.id) {
    return res.status(409).json({ error: "Another account already uses that email." });
  }

  await updateUserDetails(req.user.id, fullname, email);
  res.json({ user: publicUser(await findUserById(req.user.id)) });
});

// Change your password. Needs the current one, so someone using an unlocked
// computer can't quietly take over the account.
router.put("/me/password", requireAuth, async (req, res) => {
  const currentPassword = String(req.body.currentPassword ?? "");
  const newPassword = String(req.body.newPassword ?? "");

  if (newPassword.length < 6) {
    return res.status(400).json({ error: "Your new password must be at least 6 characters." });
  }
  // Checking the current password is another place to guess it, so it gets the same limit.
  const waitMinutes = loginWaitMinutes(req.user.email, req.ip);
  if (waitMinutes) {
    res.set("Retry-After", String(waitMinutes * 60));
    return res.status(429).json({ error: tooManyAttemptsMessage(waitMinutes) });
  }
  if (!(await changeUserPassword(req.user.id, currentPassword, newPassword))) {
    recordLoginFailure(req.user.email, req.ip);
    return res.status(403).json({ error: "Your current password isn't right." });
  }
  clearLoginFailures(req.user.email);

  // Log out any other devices, in case someone else knew the old password.
  deleteOtherSessions(req.user.id, req.cookies[SESSION_COOKIE]);
  res.status(204).end();
});

// A teacher who forgot their password sets a new one using the school's teacher code.
// Anyone who knows the code could use it, so it's rate-limited like login, every failure gets
// the same message (so it doesn't reveal who has an account), and it logs the teacher out everywhere.
router.post("/teacher-reset", async (req, res) => {
  const email = String(req.body.email ?? "").trim().toLowerCase();
  const teacherCode = String(req.body.teacherCode ?? "").trim();
  const newPassword = String(req.body.newPassword ?? "");

  if (newPassword.length < 6) {
    return res.status(400).json({ error: "Your new password must be at least 6 characters." });
  }
  const waitMinutes = loginWaitMinutes(email, req.ip);
  if (waitMinutes) {
    res.set("Retry-After", String(waitMinutes * 60));
    return res.status(429).json({ error: tooManyAttemptsMessage(waitMinutes) });
  }

  const user = await findUserByEmail(email);
  const codeIsRight = Boolean(process.env.TEACHER_CODE) && teacherCode === process.env.TEACHER_CODE;
  if (!user || user.role !== "teacher" || !codeIsRight) {
    recordLoginFailure(email, req.ip);
    return res.status(403).json({ error: "That email and teacher code don't match a teacher account." });
  }

  await setOwnPassword(user.id, newPassword);
  deleteAllSessions(user.id);
  clearLoginFailures(email);
  logIn(res, user);
  res.json({ user: publicUser(await findUserById(user.id)) });
});

router.post("/logout", (req, res) => {
  deleteSession(req.cookies[SESSION_COOKIE]);
  res.clearCookie(SESSION_COOKIE);
  res.status(204).end();
});

export default router;
