import { submitAttempt } from "./attempts.js";

// Extra seconds after the deadline we still accept answers, for slow connections.
const GRACE_SECONDS = 15;

// The time an attempt ends: when it started plus the exam's time limit.
export function deadlineFor(attempt, exam) {
  return new Date(new Date(attempt.startedAt).getTime() + exam.timeLimitMinutes * 60 * 1000);
}

export function isTimeUp(attempt, exam) {
  return Date.now() > deadlineFor(attempt, exam).getTime() + GRACE_SECONDS * 1000;
}

// "  Forty  Two " -> "forty two", so capitals and extra spaces don't matter.
function tidyText(text) {
  return String(text).trim().replace(/\s+/g, " ").toLowerCase();
}

// Is the student's answer to this question right? Every question is worth 1 mark.
export function isCorrect(question, given) {
  if (given === undefined || given === null) return false;
  switch (question.type) {
    case "multiple": {
      // All or nothing: exactly the right options ticked, no more, no fewer.
      if (!Array.isArray(given) || given.length !== question.answer.length) return false;
      return question.answer.every((option) => given.includes(option));
    }
    case "short":
      return question.answer.some((accepted) => tidyText(accepted) === tidyText(given));
    default: // "single" and "truefalse": one option number
      return given === question.answer;
  }
}

// Counts the questions the student got right.
function markAnswers(exam, answers) {
  return exam.questions.filter((question) => isCorrect(question, answers[question.id])).length;
}

// Marks and submits the attempt using the answers saved so far.
export async function finishAttempt(attempt, exam) {
  await submitAttempt(attempt.id, markAnswers(exam, attempt.answers));
}
