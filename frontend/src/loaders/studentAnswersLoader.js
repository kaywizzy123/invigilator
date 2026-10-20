import { data } from "react-router";
import { requireTeacher } from "./requireTeacher";

// One student's answers to one of the teacher's exams.
export async function studentAnswersLoader({ params }) {
  await requireTeacher();
  const res = await fetch(`/api/exams/${params.examId}/attempts/${params.attemptId}`);
  if (!res.ok) {
    throw data("Not found.", { status: 404 });
  }
  const body = await res.json();
  return body.attempt;
}
