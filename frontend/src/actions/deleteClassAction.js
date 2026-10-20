import { redirect } from "react-router";

export async function deleteClassAction({ params }) {
  await fetch(`/api/classes/${params.classId}`, { method: "DELETE" });
  return redirect("/classes");
}
