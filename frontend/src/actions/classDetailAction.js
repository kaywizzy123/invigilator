// The class page has two buttons on each student. Each sends an "intent",
// so this one action knows which was pressed.
export async function classDetailAction({ request, params }) {
  const formData = await request.formData();
  const intent = formData.get("intent");
  const studentId = formData.get("studentId");
  const studentUrl = `/api/classes/${params.classId}/students/${studentId}`;

  if (intent === "remove") {
    await fetch(studentUrl, { method: "DELETE" });
    // Returning nothing keeps us on the page; React Router reloads the class, so the list updates.
    return null;
  }

  if (intent === "reset") {
    let res;
    try {
      res = await fetch(`${studentUrl}/reset-password`, { method: "POST" });
    } catch {
      return { error: "Couldn't reach the server. Is the backend running?" };
    }
    const data = await res.json();
    if (!res.ok) return { error: data.error };
    return { studentName: formData.get("studentName"), temporaryPassword: data.temporaryPassword };
  }

  return null;
}
