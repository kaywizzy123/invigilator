import { redirect } from "react-router";

// Saves an exam's opening and closing times. The dashboard sends { opensAt, closesAt } as JSON
// (UTC date strings, or null for "no limit").
export async function setScheduleAction({ request, params }) {
  const { opensAt, closesAt } = await request.json();
  await fetch(`/api/exams/${params.examId}/schedule`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ opensAt, closesAt }),
  });
  return redirect("/dashboard");
}
