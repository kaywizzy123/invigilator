import { redirect } from "react-router";

export async function closeExamAction({ params }) {
  await fetch(`/api/exams/${params.examId}/close`, { method: "POST" });
  return redirect("/dashboard");
}
