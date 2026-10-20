import { redirect } from "react-router";

// Copies the exam, then opens the copy ready to edit.
export async function duplicateExamAction({ params }) {
  const res = await fetch(`/api/exams/${params.examId}/duplicate`, { method: "POST" });
  if (!res.ok) {
    return redirect("/dashboard");
  }
  const { exam } = await res.json();
  return redirect(`/exams/${exam.id}/edit`);
}
