import { randomBytes, randomInt, randomUUID, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import db from "./db.js";

const scryptAsync = promisify(scrypt);

async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const hash = await scryptAsync(password, salt, 64);
  return `${salt}:${hash.toString("hex")}`;
}

async function verifyPassword(password, stored) {
  const [salt, hash] = stored.split(":");
  const attempt = await scryptAsync(password, salt, 64);
  return timingSafeEqual(attempt, Buffer.from(hash, "hex"));
}

const findByEmail = db.prepare(`
  SELECT id, email, fullname, role, password_hash AS passwordHash, created_at AS createdAt,
         must_change_password AS mustChangePassword
  FROM users
  WHERE email = ?
`);

const findById = db.prepare(`
  SELECT id, email, fullname, role, created_at AS createdAt,
         must_change_password AS mustChangePassword
  FROM users
  WHERE id = ?
`);

const findPasswordHash = db.prepare(`
  SELECT password_hash AS passwordHash FROM users WHERE id = ?
`);

const updateDetails = db.prepare(`
  UPDATE users SET fullname = ?, email = ? WHERE id = ?
`);

// Choosing your own password always clears the "must change" flag.
const updatePasswordHash = db.prepare(`
  UPDATE users SET password_hash = ?, must_change_password = 0 WHERE id = ?
`);

const setTemporaryHash = db.prepare(`
  UPDATE users SET password_hash = ?, must_change_password = 1 WHERE id = ?
`);

// Easy to read aloud or copy from a screen: no O/0, I/1/L.
const TEMPORARY_CHARACTERS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

const insertUser = db.prepare(`
  INSERT INTO users (id, email, fullname, role, password_hash, created_at)
  VALUES (?, ?, ?, ?, ?, ?)
`);

export async function findUserByEmail(email) {
  return findByEmail.get(email);
}

export async function findUserById(id) {
  return findById.get(id);
}

export async function createUser(email, password, fullname, role = "student") {
  const user = {
    id: randomUUID(),
    email,
    fullname,
    role,
    passwordHash: await hashPassword(password),
    createdAt: new Date().toISOString(),
  };
  insertUser.run(user.id, user.email, user.fullname, user.role, user.passwordHash, user.createdAt);
  return user;
}

export async function checkLogin(email, password) {
  const user = await findUserByEmail(email);
  if (!user) return null;
  return (await verifyPassword(password, user.passwordHash)) ? user : null;
}

export async function updateUserDetails(id, fullname, email) {
  updateDetails.run(fullname, email, id);
}

// Changes the password if currentPassword is right. Returns true if it changed.
export async function changeUserPassword(id, currentPassword, newPassword) {
  const { passwordHash } = findPasswordHash.get(id);
  if (!(await verifyPassword(currentPassword, passwordHash))) return false;
  updatePasswordHash.run(await hashPassword(newPassword), id);
  return true;
}

// Gives the user a new random temporary password, e.g. "K7QM-2XP4", and marks the account so
// they must choose their own password after logging in. Returns the temporary password,
// which is only ever shown once: like every password, only its hash is stored.
export async function setTemporaryPassword(id) {
  let temporary = "";
  for (let i = 0; i < 8; i++) {
    if (i === 4) temporary += "-";
    temporary += TEMPORARY_CHARACTERS[randomInt(TEMPORARY_CHARACTERS.length)];
  }
  setTemporaryHash.run(await hashPassword(temporary), id);
  return temporary;
}
