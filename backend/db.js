import { mkdirSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";

mkdirSync(new URL("./data/", import.meta.url), { recursive: true });

const db = new DatabaseSync(new URL("./data/app.db", import.meta.url).pathname);

// The questions table's columns. Used to create it, and to rebuild it (see below).
// type:    'single' (multiple choice), 'multiple' (tick all that apply), 'truefalse' or 'short'
// options: JSON list of option texts ([] for short answer)
// answer:  JSON. single/truefalse: the correct option number; multiple: a list of option numbers;
//          short: a list of accepted answers
const QUESTION_COLUMNS = `
  id       TEXT PRIMARY KEY,
  exam_id  TEXT NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  type     TEXT NOT NULL DEFAULT 'single' CHECK (type IN ('single', 'multiple', 'truefalse', 'short')),
  text     TEXT NOT NULL,
  options  TEXT NOT NULL,
  answer   TEXT NOT NULL
`;

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id            TEXT PRIMARY KEY,
    email         TEXT NOT NULL UNIQUE,
    fullname      TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    role          TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'teacher')),
    created_at    TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS sessions (
    id         TEXT PRIMARY KEY,
    user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS exams (
    id                 TEXT PRIMARY KEY,
    teacher_id         TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title              TEXT NOT NULL,
    time_limit_minutes INTEGER NOT NULL CHECK (time_limit_minutes > 0),
    created_at         TEXT NOT NULL,
    published_at       TEXT,
    closed_at          TEXT
  );

  CREATE TABLE IF NOT EXISTS questions (${QUESTION_COLUMNS});

  CREATE TABLE IF NOT EXISTS attempts (
    id           TEXT PRIMARY KEY,
    exam_id      TEXT NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    student_id   TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    started_at   TEXT NOT NULL,
    submitted_at TEXT,
    answers      TEXT,
    score        INTEGER,
    layout       TEXT,
    UNIQUE (exam_id, student_id)
  );

  CREATE TABLE IF NOT EXISTS classes (
    id         TEXT PRIMARY KEY,
    teacher_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name       TEXT NOT NULL,
    code       TEXT NOT NULL UNIQUE,
    created_at TEXT NOT NULL
  );

  -- Which students are in which classes. A student can be in many classes.
  CREATE TABLE IF NOT EXISTS class_members (
    class_id   TEXT NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    student_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    joined_at  TEXT NOT NULL,
    PRIMARY KEY (class_id, student_id)
  );

  -- Each failed password attempt, used to slow down password guessing (see loginLimits.js).
  CREATE TABLE IF NOT EXISTS login_failures (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    email     TEXT NOT NULL,
    ip        TEXT NOT NULL,
    failed_at TEXT NOT NULL
  );

  -- Which classes each exam is set for. An exam can be set for many classes.
  CREATE TABLE IF NOT EXISTS exam_classes (
    exam_id  TEXT NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    class_id TEXT NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    PRIMARY KEY (exam_id, class_id)
  );
`);

// CREATE TABLE IF NOT EXISTS skips tables that already exist, so columns added later
// must be added to an older database by hand. This adds a column once, if it's missing.
function addColumnIfMissing(table, column, definition) {
  const columns = db.prepare(`PRAGMA table_info(${table})`).all();
  if (!columns.some((existing) => existing.name === column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
}

// Existing users become students.
addColumnIfMissing("users", "role", "TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'teacher'))");
// NULL means a draft; a date means published (visible to students).
addColumnIfMissing("exams", "published_at", "TEXT");
// NULL means open; a date means closed (no new students can start).
addColumnIfMissing("exams", "closed_at", "TEXT");
// This student's shuffled order of questions and options (JSON). NULL means the original order.
addColumnIfMissing("attempts", "layout", "TEXT");
// 1 after a teacher resets the password: the user must choose a new one when they log in.
addColumnIfMissing("users", "must_change_password", "INTEGER NOT NULL DEFAULT 0");

// Questions used to have a correct_option column limited to 0-3. SQLite can't change a
// column's rules, so an old questions table is rebuilt: make a new table in the new shape,
// copy every question across (each old one becomes multiple choice), then swap it in.
const questionColumns = db.prepare("PRAGMA table_info(questions)").all();
if (questionColumns.some((column) => column.name === "correct_option")) {
  db.exec(`
    BEGIN;
    CREATE TABLE questions_new (${QUESTION_COLUMNS});
    INSERT INTO questions_new (id, exam_id, position, type, text, options, answer)
      SELECT id, exam_id, position, 'single', text, options, CAST(correct_option AS TEXT)
      FROM questions;
    DROP TABLE questions;
    ALTER TABLE questions_new RENAME TO questions;
    COMMIT;
  `);
}

// Runs fn inside a transaction: either everything it does is saved, or none of it.
export function inTransaction(fn) {
  db.exec("BEGIN");
  try {
    fn();
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

export default db;
