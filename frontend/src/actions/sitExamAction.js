import { redirect } from "react-router";

// Hands the exam in. The server marks the answers it has already saved.
export async function sitExamAction({ params }) {
  try {
    await fetch(`/api/student/exams/${params.examId}/submit`, { method: "POST" });
  } catch {
    return { form: "Couldn't reach the server to hand in. Check your connection and try again." };
  }
  return redirect(`/exams/${params.examId}/result`);
}
