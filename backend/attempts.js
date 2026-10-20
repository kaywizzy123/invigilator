import { randomUUID } from "node:crypto";
import db from "./db.js";

// The published exams this student can see, plus their attempt at each if they have one.
// They see an exam if it's set for one of their classes, or if they've already started it
// (so removing a student from a class never takes away an exam they're sitting or their result).
const findPublishedExamsForStudent = db.prepare(`
  SELECT exams.id, exams.title, exams.time_limit_minutes AS timeLimitMinutes,
         exams.closed_at AS closedAt, exams.opens_at AS opensAt, exams.closes_at AS closesAt,
         users.fullname AS teacherName,
         (SELECT COUNT(*) FROM questions WHERE questions.exam_id = exams.id) AS questionCount,
         attempts.started_at AS startedAt, attempts.submitted_at AS submittedAt,
         attempts.score
  FROM exams
  JOIN users ON users.id = exams.teacher_id
  LEFT JOIN attempts ON attempts.exam_id = exams.id AND attempts.student_id = ?
  WHERE exams.published_at IS NOT NULL
    AND (
      attempts.id IS NOT NULL
      OR EXISTS (
        SELECT 1
        FROM exam_classes
        JOIN class_members ON class_members.class_id = exam_classes.class_id
        WHERE exam_classes.exam_id = exams.id AND class_members.student_id = ?
      )
    )
  ORDER BY exams.published_at DESC
`);

const findAttempt = db.prepare(`
  SELECT id, started_at AS startedAt, submitted_at AS submittedAt, answers, score, layout
  FROM attempts
  WHERE exam_id = ? AND student_id = ?
`);

// Every attempt at one exam, with the student's name, for the teacher's results.
const findAttemptsForExam = db.prepare(`
  SELECT attempts.id, users.id AS studentId, users.fullname, users.email,
         attempts.started_at AS startedAt, attempts.submitted_at AS submittedAt,
         attempts.answers, attempts.score
  FROM attempts
  JOIN users ON users.id = attempts.student_id
  WHERE attempts.exam_id = ?
  ORDER BY users.fullname
`);

// One attempt with the student's name, for the teacher's view of their answers.
const findAttemptByIdQuery = db.prepare(`
  SELECT attempts.id, attempts.exam_id AS examId, users.id AS studentId, users.fullname, users.email,
         attempts.started_at AS startedAt, attempts.submitted_at AS submittedAt,
         attempts.answers, attempts.score, attempts.layout
  FROM attempts
  JOIN users ON users.id = attempts.student_id
  WHERE attempts.id = ?
`);

// OR IGNORE: if this student already has an attempt (the UNIQUE rule), do nothing.
const insertAttempt = db.prepare(`
  INSERT OR IGNORE INTO attempts (id, exam_id, student_id, started_at, layout)
  VALUES (?, ?, ?, ?, ?)
`);

// The "submitted_at IS NULL" parts mean a submitted attempt can never be changed.
const updateAnswers = db.prepare(`
  UPDATE attempts SET answers = ? WHERE id = ? AND submitted_at IS NULL
`);

const markSubmitted = db.prepare(`
  UPDATE attempts SET submitted_at = ?, score = ? WHERE id = ? AND submitted_at IS NULL
`);

// answers is stored as JSON text: { "<question id>": <chosen option 0-3>, ... }
// layout is stored as JSON text too (see randomLayout in routes/student.js), or NULL.
function withParsedAnswers(attempt) {
  if (!attempt) return null;
  return {
    ...attempt,
    answers: JSON.parse(attempt.answers ?? "{}"),
    layout: attempt.layout ? JSON.parse(attempt.layout) : null,
  };
}

export async function listPublishedExamsForStudent(studentId) {
  // The query has two "?" marks, both the student's id.
  return findPublishedExamsForStudent.all(studentId, studentId);
}

export async function findAttemptFor(examId, studentId) {
  return withParsedAnswers(findAttempt.get(examId, studentId));
}

export async function listAttemptsForExam(examId) {
  return findAttemptsForExam.all(examId).map(withParsedAnswers);
}

export async function findAttemptById(attemptId) {
  return withParsedAnswers(findAttemptByIdQuery.get(attemptId));
}

// Starts the student's one attempt at an exam, or returns it if they already started.
// The layout is only saved the first time, so the order never changes after that.
export async function startAttempt(examId, studentId, layout) {
  insertAttempt.run(randomUUID(), examId, studentId, new Date().toISOString(), JSON.stringify(layout));
  return withParsedAnswers(findAttempt.get(examId, studentId));
}

export async function saveAnswers(attemptId, answers) {
  updateAnswers.run(JSON.stringify(answers), attemptId);
}

export async function submitAttempt(attemptId, score) {
  markSubmitted.run(new Date().toISOString(), score, attemptId);
}
