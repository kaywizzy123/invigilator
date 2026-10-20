import { data } from "react-router";
import { requireTeacher } from "./requireTeacher";

// Loads the results of one of the teacher's exams.
export async function classResultsLoader({ params }) {
  await requireTeacher();

  const res = await fetch(`/api/exams/${params.examId}/results`);
  if (!res.ok) {
    throw data("Exam not found.", { status: 404 });
  }
  const body = await res.json();
  return body.results;
}
