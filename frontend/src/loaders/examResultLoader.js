import { redirect } from "react-router";
import { requireUser } from "./requireUser";

// Loads a student's marked exam. Only available once they've handed it in.
export async function examResultLoader({ params }) {
  const user = await requireUser();
  if (user.role !== "student") {
    throw redirect("/dashboard");
  }

  const res = await fetch(`/api/student/exams/${params.examId}/result`);
  if (!res.ok) {
    throw redirect("/dashboard");
  }
  const body = await res.json();
  return body.result;
}
