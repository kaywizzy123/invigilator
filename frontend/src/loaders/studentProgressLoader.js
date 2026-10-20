import { data } from "react-router";
import { requireTeacher } from "./requireTeacher";

// A teacher's view of one student in their class: scores on the teacher's own exams.
export async function studentProgressLoader({ params }) {
  await requireTeacher();
  const res = await fetch(`/api/classes/${params.classId}/students/${params.studentId}/progress`);
  if (!res.ok) {
    throw data("Student not found.", { status: 404 });
  }
  const body = await res.json();
  return body.progress;
}
