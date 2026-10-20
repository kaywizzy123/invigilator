// Removes a student from the class on this page.
export async function removeStudentAction({ request, params }) {
  const formData = await request.formData();
  const studentId = formData.get("studentId");
  await fetch(`/api/classes/${params.classId}/students/${studentId}`, { method: "DELETE" });
  // Returning nothing keeps us on the page; React Router reloads the class, so the list updates.
  return null;
}
