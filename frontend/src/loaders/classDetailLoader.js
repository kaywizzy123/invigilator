import { data } from "react-router";
import { requireTeacher } from "./requireTeacher";

// One class with its join code and students.
export async function classDetailLoader({ params }) {
  await requireTeacher();
  const res = await fetch(`/api/classes/${params.classId}`);
  if (!res.ok) {
    throw data("Class not found.", { status: 404 });
  }
  const body = await res.json();
  return body.class;
}
