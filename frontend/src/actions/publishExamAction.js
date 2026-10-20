import { redirect } from "react-router";

export async function publishExamAction({ params }) {
  await fetch(`/api/exams/${params.examId}/publish`, { method: "POST" });
  return redirect("/dashboard");
}
