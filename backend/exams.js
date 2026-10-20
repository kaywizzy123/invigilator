import { randomUUID } from "node:crypto";
import db, { inTransaction } from "./db.js";

const insertExam = db.prepare(`
  INSERT INTO exams (id, teacher_id, title, time_limit_minutes, created_at)
  VALUES (?, ?, ?, ?, ?)
`);

const updateExamRow = db.prepare(`
  UPDATE exams SET title = ?, time_limit_minutes = ? WHERE id = ?
`);

// options and answer are stored as JSON text (see QUESTION_COLUMNS in db.js).
const insertQuestion = db.prepare(`
  INSERT INTO questions (id, exam_id, position, type, text, options, answer)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

const deleteQuestions = db.prepare(`DELETE FROM questions WHERE exam_id = ?`);

// Its questions go too, through ON DELETE CASCADE.
const deleteExamRow = db.prepare(`DELETE FROM exams WHERE id = ?`);

const setClosedAt = db.prepare(`UPDATE exams SET closed_at = ? WHERE id = ?`);

const setPublishedAt = db.prepare(`
  UPDATE exams SET published_at = ? WHERE id = ? AND published_at IS NULL
`);

const findExam = db.prepare(`
  SELECT id, teacher_id AS teacherId, title, time_limit_minutes AS timeLimitMinutes,
         created_at AS createdAt, published_at AS publishedAt, closed_at AS closedAt,
         (SELECT COUNT(*) FROM attempts WHERE attempts.exam_id = exams.id) AS attemptCount
  FROM exams
  WHERE id = ?
`);

const findQuestions = db.prepare(`
  SELECT id, type, text, options, answer
  FROM questions
  WHERE exam_id = ?
  ORDER BY position
`);

const findExamsByTeacher = db.prepare(`
  SELECT exams.id, exams.title, exams.time_limit_minutes AS timeLimitMinutes,
         exams.created_at AS createdAt, exams.published_at AS publishedAt,
         exams.closed_at AS closedAt, COUNT(questions.id) AS questionCount,
         (SELECT COUNT(*) FROM attempts WHERE attempts.exam_id = exams.id) AS attemptCount
  FROM exams
  LEFT JOIN questions ON questions.exam_id = exams.id
  WHERE exams.teacher_id = ?
  GROUP BY exams.id
  ORDER BY exams.created_at DESC
`);

function insertQuestions(examId, questions) {
  questions.forEach((question, index) => {
    insertQuestion.run(
      randomUUID(),
      examId,
      index,
      question.type,
      question.text,
      JSON.stringify(question.options),
      JSON.stringify(question.answer),
    );
  });
}

// questions: [{ type, text, options, answer }], already checked by validateExam
export async function createExam(teacherId, title, timeLimitMinutes, questions) {
  const exam = {
    id: randomUUID(),
    title,
    timeLimitMinutes,
    createdAt: new Date().toISOString(),
    publishedAt: null,
    closedAt: null,
    questionCount: questions.length,
    attemptCount: 0,
  };
  inTransaction(() => {
    insertExam.run(exam.id, teacherId, title, timeLimitMinutes, exam.createdAt);
    insertQuestions(exam.id, questions);
  });
  return exam;
}

// Replaces the exam's title, time limit and its whole list of questions.
export async function updateExam(examId, title, timeLimitMinutes, questions) {
  inTransaction(() => {
    updateExamRow.run(title, timeLimitMinutes, examId);
    deleteQuestions.run(examId);
    insertQuestions(examId, questions);
  });
}

export async function deleteExam(examId) {
  deleteExamRow.run(examId);
}

// Makes the exam visible to students. Publishing twice keeps the first date.
export async function publishExam(examId) {
  setPublishedAt.run(new Date().toISOString(), examId);
}

// Stops new students starting the exam. Anyone already sitting it can finish.
export async function closeExam(examId) {
  setClosedAt.run(new Date().toISOString(), examId);
}

export async function reopenExam(examId) {
  setClosedAt.run(null, examId);
}

// Returns the exam with its questions in order, or null if there's no such exam.
export async function findExamById(examId) {
  const exam = findExam.get(examId);
  if (!exam) return null;
  const questions = findQuestions.all(examId).map((question) => ({
    ...question,
    options: JSON.parse(question.options),
    answer: JSON.parse(question.answer),
  }));
  return { ...exam, questions };
}

export async function listExamsByTeacher(teacherId) {
  return findExamsByTeacher.all(teacherId);
}
