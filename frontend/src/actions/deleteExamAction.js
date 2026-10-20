import { redirect } from "react-router";

export async function deleteExamAction({ params }) {
  await fetch(`/api/exams/${params.examId}`, { method: "DELETE" });
  return redirect("/dashboard");
}
