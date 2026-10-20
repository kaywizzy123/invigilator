import { data, redirect } from "react-router";
import { requireTeacher } from "./requireTeacher";

// Loads the exam to edit. `params.examId` comes from the :examId part of the URL.
export async function editExamLoader({ params }) {
  await requireTeacher();

  const res = await fetch(`/api/exams/${params.examId}`);
  if (!res.ok) {
    // Shows the 404 page (NotFound) for a missing exam or someone else's.
    throw data("Exam not found.", { status: 404 });
  }
  const body = await res.json();
  if (body.exam.attemptCount > 0) {
    // Locked: students have started it, so there's nothing to edit.
    throw redirect("/dashboard");
  }
  return body.exam;
}
