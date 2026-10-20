import { redirect } from "react-router";

export async function startExamAction({ params }) {
  await fetch(`/api/student/exams/${params.examId}/start`, { method: "POST" });
  return redirect(`/exams/${params.examId}/sit`);
}
