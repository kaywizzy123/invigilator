import { Router } from "express";
import {
  findAttemptFor,
  listPublishedExamsForStudent,
  saveAnswers,
  startAttempt,
} from "../attempts.js";
import { isStudentInExamClass } from "../classes.js";
import { findExamById } from "../exams.js";
import { inStudentOrder, randomLayout } from "../layout.js";
import { loadProgress } from "../progress.js";
import { deadlineFor, finishAttempt, isCorrect, isTimeUp } from "../marking.js";
import { requireAuth, requireStudent } from "../middleware.js";

const router = Router();

// Finds a published exam, or null. Drafts count as "not found" for students.
async function findPublishedExam(examId) {
  const exam = await findExamById(examId);
  return exam && exam.publishedAt ? exam : null;
}

// Loads the published exam and this student's attempt at it.
// If time ran out without a submit (say, the browser was closed), submits it now.
async function loadAttempt(examId, studentId) {
  const exam = await findPublishedExam(examId);
  let attempt = exam && (await findAttemptFor(exam.id, studentId));
  if (attempt && !attempt.submittedAt && isTimeUp(attempt, exam)) {
    await finishAttempt(attempt, exam);
    attempt = await findAttemptFor(exam.id, studentId);
  }
  return { exam, attempt };
}

// The exam as this student may see it: their order, no correct answers.
function examForStudent(exam, layout) {
  return {
    id: exam.id,
    title: exam.title,
    timeLimitMinutes: exam.timeLimitMinutes,
    questions: inStudentOrder(exam, layout).map(({ id, type, text, options }) => ({ id, type, text, options })),
  };
}

// Published exams, each with this student's status.
router.get("/student/exams", requireAuth, requireStudent, async (req, res) => {
  // Loading each unfinished attempt submits it if its time ran out,
  // so the list below shows it as submitted.
  for (const exam of await listPublishedExamsForStudent(req.user.id)) {
    if (exam.startedAt && !exam.submittedAt) {
      await loadAttempt(exam.id, req.user.id);
    }
  }
  const exams = await listPublishedExamsForStudent(req.user.id);
  res.json({ exams });
});

// Your scores across every exam you've handed in, oldest first.
router.get("/student/progress", requireAuth, requireStudent, async (req, res) => {
  res.json({ progress: { fullname: req.user.fullname, exams: await loadProgress(req.user.id) } });
});

// Start the exam (or carry on with an attempt already started).
router.post("/student/exams/:examId/start", requireAuth, requireStudent, async (req, res) => {
  const exam = await findPublishedExam(req.params.examId);
  if (!exam) {
    return res.status(404).json({ error: "Exam not found." });
  }
  // Someone who already started can always carry on (until the deadline). Starting fresh
  // needs the exam to be set for one of your classes, open, and within its schedule.
  if (!(await findAttemptFor(exam.id, req.user.id))) {
    if (!(await isStudentInExamClass(exam.id, req.user.id))) {
      return res.status(404).json({ error: "Exam not found." });
    }
    const now = Date.now();
    if (exam.closedAt || (exam.closesAt && now >= new Date(exam.closesAt).getTime())) {
      return res.status(403).json({ error: "This exam is closed." });
    }
    if (exam.opensAt && now < new Date(exam.opensAt).getTime()) {
      return res.status(403).json({ error: "This exam hasn't opened yet.", opensAt: exam.opensAt });
    }
  }
  await startAttempt(exam.id, req.user.id, randomLayout(exam));
  res.status(204).end();
});

// Everything the exam page needs: the questions (without answers), saved answers and time left.
router.get("/student/exams/:examId/attempt", requireAuth, requireStudent, async (req, res) => {
  const { exam, attempt } = await loadAttempt(req.params.examId, req.user.id);
  if (!attempt) {
    return res.status(404).json({ error: "You haven't started this exam." });
  }

  const deadline = deadlineFor(attempt, exam);
  // Worked out on the server, so a wrong clock on the student's computer doesn't matter.
  const secondsLeft = Math.max(0, Math.floor((deadline.getTime() - Date.now()) / 1000));
  res.json({
    exam: examForStudent(exam, attempt.layout),
    attempt: {
      startedAt: attempt.startedAt,
      submittedAt: attempt.submittedAt,
      answers: attempt.answers,
      deadline: deadline.toISOString(),
      secondsLeft,
    },
  });
});

// Longest short answer we'll store.
const MAX_SHORT_ANSWER = 200;

// Tidies a student's answer to one question. Returns { answer } if it's a valid answer,
// { empty: true } if they cleared it, or { error } if it doesn't fit the question.
function readAnswer(question, given) {
  const isOption = (value) => Number.isInteger(value) && value >= 0 && value < question.options.length;
  switch (question.type) {
    case "multiple": {
      if (!Array.isArray(given) || !given.every(isOption)) return { error: "Pick from the options." };
      const ticked = [...new Set(given)].sort((a, b) => a - b);
      return ticked.length === 0 ? { empty: true } : { answer: ticked };
    }
    case "short": {
      if (typeof given !== "string") return { error: "Type your answer." };
      const text = given.trim();
      if (text.length > MAX_SHORT_ANSWER) return { error: "That answer is too long." };
      return text === "" ? { empty: true } : { answer: text };
    }
    default: // "single" and "truefalse"
      return isOption(given) ? { answer: given } : { error: "Pick one of the options." };
  }
}

// Save one answer as soon as the student gives it: { questionId, answer }.
// answer is an option number, a list of option numbers, or text, depending on the question.
router.put("/student/exams/:examId/answers", requireAuth, requireStudent, async (req, res) => {
  const { exam, attempt } = await loadAttempt(req.params.examId, req.user.id);
  if (!attempt) {
    return res.status(404).json({ error: "You haven't started this exam." });
  }
  if (attempt.submittedAt) {
    return res.status(409).json({ error: "This exam has already been submitted." });
  }

  const question = exam.questions.find((item) => item.id === String(req.body.questionId ?? ""));
  if (!question) {
    return res.status(400).json({ error: "That question isn't in this exam." });
  }
  const { answer, empty, error } = readAnswer(question, req.body.answer);
  if (error) {
    return res.status(400).json({ error });
  }

  // A cleared answer (no boxes ticked, or an empty text box) counts as unanswered.
  const answers = { ...attempt.answers };
  if (empty) {
    delete answers[question.id];
  } else {
    answers[question.id] = answer;
  }
  await saveAnswers(attempt.id, answers);
  res.status(204).end();
});

// Hand the exam in. Marks whatever answers have been saved.
router.post("/student/exams/:examId/submit", requireAuth, requireStudent, async (req, res) => {
  const { exam, attempt } = await loadAttempt(req.params.examId, req.user.id);
  if (!attempt) {
    return res.status(404).json({ error: "You haven't started this exam." });
  }
  if (!attempt.submittedAt) {
    await finishAttempt(attempt, exam);
  }
  res.status(204).end();
});

// The marked exam, once handed in: score, plus every question with the student's
// answer and the correct one. Correct answers are only sent after submitting.
router.get("/student/exams/:examId/result", requireAuth, requireStudent, async (req, res) => {
  const { exam, attempt } = await loadAttempt(req.params.examId, req.user.id);
  if (!attempt || !attempt.submittedAt) {
    return res.status(404).json({ error: "There's no result for this exam yet." });
  }

  res.json({
    result: {
      title: exam.title,
      score: attempt.score,
      total: exam.questions.length,
      submittedAt: attempt.submittedAt,
      questions: inStudentOrder(exam, attempt.layout).map((question) => ({
        id: question.id,
        type: question.type,
        text: question.text,
        options: question.options,
        answer: question.answer,
        yourAnswer: attempt.answers[question.id] ?? null,
        // Decided by the server's marking rules, so the page never has to repeat them.
        correct: isCorrect(question, attempt.answers[question.id]),
      })),
    },
  });
});

export default router;
