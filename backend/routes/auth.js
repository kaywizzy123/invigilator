import { Router } from "express";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  createSession,
  deleteOtherSessions,
  deleteSession,
} from "../sessions.js";
import {
  changeUserPassword,
  checkLogin,
  createUser,
  findUserByEmail,
  findUserById,
  updateUserDetails,
} from "../users.js";
import { requireAuth } from "../middleware.js";

const router = Router();

// Never send the password hash back to the browser.
function publicUser(user) {
  return {
    id: user.id,
    email: user.email,
    fullname: user.fullname,
    role: user.role,
    createdAt: user.createdAt,
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

  const user = await checkLogin(email, password);
  if (!user) {
    return res.status(401).json({ error: "Incorrect email or password." });
  }

  logIn(res, user);
  res.json({ user: publicUser(user) });
});

router.get("/me", requireAuth, (req, res) => {
  res.json({ user: publicUser(req.user) });
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
  if (!(await changeUserPassword(req.user.id, currentPassword, newPassword))) {
    return res.status(403).json({ error: "Your current password isn't right." });
  }

  // Log out any other devices, in case someone else knew the old password.
  deleteOtherSessions(req.user.id, req.cookies[SESSION_COOKIE]);
  res.status(204).end();
});

router.post("/logout", (req, res) => {
  deleteSession(req.cookies[SESSION_COOKIE]);
  res.clearCookie(SESSION_COOKIE);
  res.status(204).end();
});

export default router;
