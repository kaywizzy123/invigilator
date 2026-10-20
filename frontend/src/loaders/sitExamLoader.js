import { redirect } from "react-router";
import { requireUser } from "./requireUser";

// Loads the exam a student is sitting: questions, their saved answers and time left.
export async function sitExamLoader({ params }) {
  const user = await requireUser();
  if (user.role !== "student") {
    throw redirect("/dashboard");
  }

  const res = await fetch(`/api/student/exams/${params.examId}/attempt`);
  if (!res.ok) {
    // Not started, or not a published exam: back to the list.
    throw redirect("/dashboard");
  }
  return res.json(); // { exam, attempt }
}
