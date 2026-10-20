import { Router } from "express";
import {
  closeExam,
  createExam,
  deleteExam,
  findExamById,
  listExamsByTeacher,
  publishExam,
  reopenExam,
  setSchedule,
  updateExam,
} from "../exams.js";
import { findAttemptById, listAttemptsForExam } from "../attempts.js";
import {
  findClassesForExam,
  findStudentClassesForExam,
  listClassesByTeacher,
  setExamClasses,
} from "../classes.js";
import { inStudentOrder } from "../layout.js";
import { findImageById } from "../images.js";
import { finishAttempt, isCorrect, isTimeUp } from "../marking.js";
import { requireAuth, requireTeacher } from "../middleware.js";

const router = Router();

const QUESTION_TYPES = ["single", "multiple", "truefalse", "short"];
const MIN_OPTIONS = 2;
const MAX_OPTIONS = 6;

// Turns anything into a list: a list stays a list, anything else becomes [].
function asList(value) {
  return Array.isArray(value) ? value : [];
}

// The parts of a question that depend on its type: options and answer.
function readQuestionByType(question) {
  const type = String(question?.type ?? "single");
  const text = String(question?.text ?? "").trim();
  if (type === "truefalse") {
    // The options are always True and False; answer 0 means True, 1 means False.
    return { type, text, options: ["True", "False"], answer: Number(question?.answer) };
  }
  if (type === "short") {
    const accepted = asList(question?.answer).map((answer) => String(answer ?? "").trim());
    return { type, text, options: [], answer: accepted.filter(Boolean) };
  }
  const options = asList(question?.options).map((option) => String(option ?? "").trim());
  if (type === "multiple") {
    // Unique option numbers, smallest first: [2, 0, 2] -> [0, 2].
    const answer = [...new Set(asList(question?.answer).map(Number))].sort((a, b) => a - b);
    return { type, text, options, answer };
  }
  return { type, text, options, answer: Number(question?.answer) };
}

// Tidies one question into the exact shape we store, whatever the browser sent.
// imageId / imageAlt: an optional uploaded image and its description for screen readers.
function readQuestion(question) {
  const imageId = question?.imageId ? String(question.imageId) : null;
  return {
    ...readQuestionByType(question),
    imageId,
    imageAlt: imageId ? String(question?.imageAlt ?? "").trim().slice(0, 300) : null,
  };
}

// Every image used must be one this teacher uploaded. Returns an error message, or null.
async function checkImages(questions, teacherId) {
  for (const [index, question] of questions.entries()) {
    if (!question.imageId) continue;
    const image = await findImageById(question.imageId);
    if (!image || image.teacherId !== teacherId) {
      return `The image on question ${index + 1} couldn't be found. Try adding it again.`;
    }
  }
  return null;
}

// Tidies what the browser sent into the exact shape we store.
function readExam(body) {
  return {
    title: String(body.title ?? "").trim(),
    timeLimitMinutes: Number(body.timeLimitMinutes),
    questions: asList(body.questions).map(readQuestion),
  };
}

// Checks one question. Returns an error message, or null if it's fine.
function checkQuestion(question, number) {
  if (!QUESTION_TYPES.includes(question.type)) return `Question ${number} has an unknown type.`;
  if (!question.text) return `Question ${number} needs some text.`;

  if (question.type === "short") {
    if (question.answer.length === 0) return `Question ${number} needs at least one accepted answer.`;
    return null;
  }
  if (question.type === "truefalse") {
    if (![0, 1].includes(question.answer)) return `Question ${number} needs True or False picked.`;
    return null;
  }

  // Multiple choice and multiple answers: 2-6 filled-in options.
  if (question.options.length < MIN_OPTIONS || question.options.length > MAX_OPTIONS) {
    return `Question ${number} needs between ${MIN_OPTIONS} and ${MAX_OPTIONS} options.`;
  }
  if (question.options.some((option) => !option)) return `Question ${number} has an empty option.`;
  const isOption = (answer) => Number.isInteger(answer) && answer >= 0 && answer < question.options.length;
  if (question.type === "multiple") {
    if (question.answer.length === 0 || !question.answer.every(isOption)) {
      return `Question ${number} needs at least one correct answer ticked.`;
    }
    return null;
  }
  if (!isOption(question.answer)) return `Question ${number} needs a correct answer picked.`;
  return null;
}

// Checks the exam a teacher sent. Returns an error message, or null if it's fine.
function validateExam({ title, timeLimitMinutes, questions }) {
  if (!title) return "Give the exam a title.";
  if (!Number.isInteger(timeLimitMinutes) || timeLimitMinutes < 1 || timeLimitMinutes > 300) {
    return "The time limit must be a whole number of minutes between 1 and 300.";
  }
  if (questions.length === 0) {
    return "Add at least one question.";
  }
  for (const [index, question] of questions.entries()) {
    const error = checkQuestion(question, index + 1);
    if (error) return error;
  }
  return null;
}

// Finds an exam that belongs to the logged-in teacher, or null.
// Someone else's exam counts as "not found", so teachers can't even tell it exists.
async function findOwnExam(req) {
  const exam = await findExamById(req.params.examId);
  return exam && exam.teacherId === req.user.id ? exam : null;
}

router.get("/exams", requireAuth, requireTeacher, async (req, res) => {
  const exams = await listExamsByTeacher(req.user.id);
  // Add the classes each exam is set for.
  for (const exam of exams) {
    exam.classes = await findClassesForExam(exam.id);
  }
  res.json({ exams });
});

router.post("/exams", requireAuth, requireTeacher, async (req, res) => {
  const { title, timeLimitMinutes, questions } = readExam(req.body);
  const error = validateExam({ title, timeLimitMinutes, questions }) ?? (await checkImages(questions, req.user.id));
  if (error) {
    return res.status(400).json({ error });
  }

  const exam = await createExam(req.user.id, title, timeLimitMinutes, questions);
  res.status(201).json({ exam });
});

router.get("/exams/:examId", requireAuth, requireTeacher, async (req, res) => {
  const exam = await findOwnExam(req);
  if (!exam) {
    return res.status(404).json({ error: "Exam not found." });
  }
  res.json({ exam });
});

router.put("/exams/:examId", requireAuth, requireTeacher, async (req, res) => {
  const existing = await findOwnExam(req);
  if (!existing) {
    return res.status(404).json({ error: "Exam not found." });
  }
  // Once a student has started, changing the questions would make results unfair.
  if (existing.attemptCount > 0) {
    return res.status(409).json({ error: "Students have already started this exam, so it can't be edited." });
  }

  const { title, timeLimitMinutes, questions } = readExam(req.body);
  const error = validateExam({ title, timeLimitMinutes, questions }) ?? (await checkImages(questions, req.user.id));
  if (error) {
    return res.status(400).json({ error });
  }

  await updateExam(req.params.examId, title, timeLimitMinutes, questions);
  res.json({ exam: await findExamById(req.params.examId) });
});

router.delete("/exams/:examId", requireAuth, requireTeacher, async (req, res) => {
  const exam = await findOwnExam(req);
  if (!exam) {
    return res.status(404).json({ error: "Exam not found." });
  }
  // Deleting would also delete the students' attempts, and with them their results.
  if (exam.attemptCount > 0) {
    return res.status(409).json({ error: "Students have sat this exam, so it can't be deleted." });
  }
  await deleteExam(exam.id);
  res.status(204).end();
});

// Copy an exam into a new draft. Works on locked exams too, so a teacher can reuse
// or fix an exam students have already sat without touching their results.
router.post("/exams/:examId/duplicate", requireAuth, requireTeacher, async (req, res) => {
  const original = await findOwnExam(req);
  if (!original) {
    return res.status(404).json({ error: "Exam not found." });
  }
  const questions = original.questions.map(({ type, text, options, answer, imageId, imageAlt }) => ({
    type,
    text,
    options,
    answer,
    imageId,
    imageAlt,
  }));
  const copy = await createExam(
    req.user.id,
    `Copy of ${original.title}`,
    original.timeLimitMinutes,
    questions,
  );
  res.status(201).json({ exam: copy });
});

// Choose which of your classes an exam is set for: { classIds: [...] }.
// Allowed on locked exams too: it changes who can sit the exam, not its questions.
router.put("/exams/:examId/classes", requireAuth, requireTeacher, async (req, res) => {
  const exam = await findOwnExam(req);
  if (!exam) {
    return res.status(404).json({ error: "Exam not found." });
  }

  const classIds = Array.isArray(req.body.classIds) ? [...new Set(req.body.classIds.map(String))] : [];
  const ownClassIds = (await listClassesByTeacher(req.user.id)).map((schoolClass) => schoolClass.id);
  if (classIds.some((classId) => !ownClassIds.includes(classId))) {
    return res.status(400).json({ error: "You can only choose your own classes." });
  }
  if (exam.publishedAt && classIds.length === 0) {
    return res.status(409).json({ error: "A published exam must be set for at least one class." });
  }

  await setExamClasses(exam.id, classIds);
  res.json({ classes: await findClassesForExam(exam.id) });
});

// Reads an optional date-time sent by the browser: an ISO string, or empty/null for none.
// Returns { value } with a tidy ISO string or null, or { error } if it isn't a real date.
function readOptionalTime(value) {
  if (value === null || value === undefined || value === "") return { value: null };
  const time = new Date(String(value));
  return Number.isNaN(time.getTime()) ? { error: true } : { value: time.toISOString() };
}

// Set when students can start the exam: { opensAt, closesAt }, either may be empty.
// Allowed on locked exams too, so a teacher can extend a deadline.
router.put("/exams/:examId/schedule", requireAuth, requireTeacher, async (req, res) => {
  const exam = await findOwnExam(req);
  if (!exam) {
    return res.status(404).json({ error: "Exam not found." });
  }
  const opens = readOptionalTime(req.body.opensAt);
  const closes = readOptionalTime(req.body.closesAt);
  if (opens.error || closes.error) {
    return res.status(400).json({ error: "Those don't look like real dates and times." });
  }
  if (opens.value && closes.value && closes.value <= opens.value) {
    return res.status(400).json({ error: "The closing time must be after the opening time." });
  }

  await setSchedule(exam.id, opens.value, closes.value);
  const updated = await findExamById(exam.id);
  res.json({ opensAt: updated.opensAt, closesAt: updated.closesAt });
});

router.post("/exams/:examId/publish", requireAuth, requireTeacher, async (req, res) => {
  const exam = await findOwnExam(req);
  if (!exam) {
    return res.status(404).json({ error: "Exam not found." });
  }
  if ((await findClassesForExam(exam.id)).length === 0) {
    return res.status(409).json({ error: "Choose at least one class before publishing." });
  }
  await publishExam(req.params.examId);
  res.json({ exam: await findExamById(req.params.examId) });
});

router.post("/exams/:examId/close", requireAuth, requireTeacher, async (req, res) => {
  const exam = await findOwnExam(req);
  if (!exam) {
    return res.status(404).json({ error: "Exam not found." });
  }
  if (!exam.publishedAt) {
    return res.status(409).json({ error: "Only published exams can be closed." });
  }
  await closeExam(exam.id);
  res.json({ exam: await findExamById(exam.id) });
});

router.post("/exams/:examId/reopen", requireAuth, requireTeacher, async (req, res) => {
  const exam = await findOwnExam(req);
  if (!exam) {
    return res.status(404).json({ error: "Exam not found." });
  }
  await reopenExam(exam.id);
  res.json({ exam: await findExamById(exam.id) });
});

// Every attempt at the exam, each with the student's classes (those the exam is set for).
// Hands in any attempts whose time ran out first, so they're counted.
async function loadAttempts(exam) {
  let attempts = await listAttemptsForExam(exam.id);
  const expired = attempts.filter((attempt) => !attempt.submittedAt && isTimeUp(attempt, exam));
  for (const attempt of expired) {
    await finishAttempt(attempt, exam);
  }
  if (expired.length > 0) {
    attempts = await listAttemptsForExam(exam.id);
  }
  for (const attempt of attempts) {
    attempt.classes = await findStudentClassesForExam(exam.id, attempt.studentId);
  }
  return attempts;
}

// Turns one value into a safe CSV cell.
function csvCell(value) {
  let text = String(value ?? "");
  // Spreadsheets treat cells starting with = + - @ as formulas. A student named
  // "=HYPERLINK(...)" could run one on the teacher's computer, so make it plain text.
  if (/^[=+\-@]/.test(text)) text = `'${text}`;
  // Cells with commas, quotes or line breaks go in quotes, with any quote doubled.
  if (/[",\n\r]/.test(text)) text = `"${text.replaceAll('"', '""')}"`;
  return text;
}

// "2026-10-19T09:41:34.065Z" -> "2026-10-19 09:41" (UTC)
function csvDate(iso) {
  return iso ? iso.slice(0, 16).replace("T", " ") : "";
}

// Results for one exam: every student's attempt, plus how the class did on each question.
router.get("/exams/:examId/results", requireAuth, requireTeacher, async (req, res) => {
  const exam = await findOwnExam(req);
  if (!exam) {
    return res.status(404).json({ error: "Exam not found." });
  }

  const attempts = await loadAttempts(exam);
  res.json({
    results: {
      exam: {
        id: exam.id,
        title: exam.title,
        timeLimitMinutes: exam.timeLimitMinutes,
        questionCount: exam.questions.length,
        classes: await findClassesForExam(exam.id),
      },
      students: attempts.map((attempt) => ({
        id: attempt.id,
        fullname: attempt.fullname,
        email: attempt.email,
        classes: attempt.classes,
        startedAt: attempt.startedAt,
        submittedAt: attempt.submittedAt,
        score: attempt.score,
        // Which questions they got right, so the page can count per question for any class.
        // Only once handed in.
        correctQuestionIds: attempt.submittedAt
          ? exam.questions
              .filter((question) => isCorrect(question, attempt.answers[question.id]))
              .map((question) => question.id)
          : [],
      })),
      questions: exam.questions.map((question) => ({ id: question.id, text: question.text })),
    },
  });
});

// One student's answers, in the order they saw the questions, with the correct answers.
router.get("/exams/:examId/attempts/:attemptId", requireAuth, requireTeacher, async (req, res) => {
  const exam = await findOwnExam(req);
  if (!exam) {
    return res.status(404).json({ error: "Exam not found." });
  }
  // Load through loadAttempts, so an attempt whose time ran out is handed in first.
  const attempt = (await loadAttempts(exam)).find((item) => item.id === req.params.attemptId);
  if (!attempt) {
    return res.status(404).json({ error: "Attempt not found." });
  }
  const { layout } = await findAttemptById(attempt.id);

  res.json({
    attempt: {
      id: attempt.id,
      fullname: attempt.fullname,
      email: attempt.email,
      classes: attempt.classes,
      startedAt: attempt.startedAt,
      submittedAt: attempt.submittedAt,
      score: attempt.score,
      total: exam.questions.length,
      examTitle: exam.title,
      questions: inStudentOrder(exam, layout).map((question) => ({
        id: question.id,
        type: question.type,
        text: question.text,
        imageId: question.imageId,
        imageAlt: question.imageAlt,
        options: question.options,
        answer: question.answer,
        yourAnswer: attempt.answers[question.id] ?? null,
        // Decided by the server's marking rules, so the page never has to repeat them.
        correct: isCorrect(question, attempt.answers[question.id]),
      })),
    },
  });
});

// The same results as a CSV file, for Excel or Google Sheets.
router.get("/exams/:examId/results.csv", requireAuth, requireTeacher, async (req, res) => {
  const exam = await findOwnExam(req);
  if (!exam) {
    return res.status(404).json({ error: "Exam not found." });
  }

  // ?classId=... downloads just that class; without it, everyone.
  const classId = req.query.classId ? String(req.query.classId) : null;
  let attempts = await loadAttempts(exam);
  if (classId) {
    attempts = attempts.filter((attempt) => attempt.classes.some((schoolClass) => schoolClass.id === classId));
  }

  const total = exam.questions.length;
  const rows = [
    ["Name", "Email", "Class", "Status", "Score", "Out of", "Percent", "Started (UTC)", "Handed in (UTC)"],
  ];
  for (const attempt of attempts) {
    const handedIn = Boolean(attempt.submittedAt);
    rows.push([
      attempt.fullname,
      attempt.email,
      attempt.classes.map((schoolClass) => schoolClass.name).join("; "),
      handedIn ? "Handed in" : "Sitting now",
      handedIn ? attempt.score : "",
      total,
      handedIn ? Math.round((attempt.score / total) * 100) : "",
      csvDate(attempt.startedAt),
      csvDate(attempt.submittedAt),
    ]);
  }
  const csv = rows.map((row) => row.map(csvCell).join(",")).join("\r\n");

  // e.g. "Basic Mathematics" + class "Year 9A" -> "basic-mathematics-year-9a-results.csv"
  const className = classId && (await findClassesForExam(exam.id)).find((schoolClass) => schoolClass.id === classId)?.name;
  const slug = [exam.title, className]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const filename = `${slug || "exam"}-results.csv`;
  res.set("Content-Type", "text/csv; charset=utf-8");
  // "attachment" tells the browser to download it as a file instead of showing it.
  res.set("Content-Disposition", `attachment; filename="${filename}"`);
  // \uFEFF (a "byte order mark") tells Excel the file is UTF-8, so names like "Ọlá" show correctly.
  res.send("\uFEFF" + csv);
});

export default router;
