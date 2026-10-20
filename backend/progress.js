import { listAttemptsForStudent } from "./attempts.js";
import { findExamById } from "./exams.js";
import { finishAttempt, isTimeUp } from "./marking.js";

// One student's handed-in exams, oldest first, for the progress page.
// teacherId: only include that teacher's exams (a teacher's view of a student);
// leave it out to include every exam (the student's own view).
export async function loadProgress(studentId, teacherId = null) {
  let attempts = await listAttemptsForStudent(studentId);

  // Hand in any attempts whose time ran out, so they're counted.
  let handedInNow = false;
  for (const attempt of attempts.filter((item) => !item.submittedAt)) {
    const exam = await findExamById(attempt.examId);
    if (isTimeUp(attempt, exam)) {
      await finishAttempt(attempt, exam);
      handedInNow = true;
    }
  }
  if (handedInNow) {
    attempts = await listAttemptsForStudent(studentId);
  }

  return attempts
    .filter((attempt) => attempt.submittedAt && (!teacherId || attempt.teacherId === teacherId))
    .sort((a, b) => a.submittedAt.localeCompare(b.submittedAt))
    .map((attempt) => ({
      attemptId: attempt.id,
      examId: attempt.examId,
      title: attempt.title,
      teacherName: attempt.teacherName,
      submittedAt: attempt.submittedAt,
      score: attempt.score,
      total: attempt.questionCount,
    }));
}
