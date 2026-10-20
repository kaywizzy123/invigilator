import { redirect } from "react-router";

// Saves which classes an exam is set for. The dashboard sends { classIds } as JSON.
export async function setExamClassesAction({ request, params }) {
  const { classIds } = await request.json();
  await fetch(`/api/exams/${params.examId}/classes`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ classIds }),
  });
  return redirect("/dashboard");
}
