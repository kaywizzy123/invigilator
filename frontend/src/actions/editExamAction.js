import { redirect } from "react-router";

export async function editExamAction({ request, params }) {
  // The page submits JSON (not form fields), so read it with request.json().
  const exam = await request.json();

  let res;
  try {
    res = await fetch(`/api/exams/${params.examId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(exam),
    });
  } catch {
    return { form: "Couldn't reach the server. Is the backend running?" };
  }

  if (!res.ok) {
    const data = await res.json();
    return { form: data.error };
  }

  return redirect("/dashboard");
}
