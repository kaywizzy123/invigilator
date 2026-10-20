import { redirect } from "react-router";

export async function reopenExamAction({ params }) {
  await fetch(`/api/exams/${params.examId}/reopen`, { method: "POST" });
  return redirect("/dashboard");
}
