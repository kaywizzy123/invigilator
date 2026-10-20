import { redirect } from "react-router";
import { requireUser } from "./requireUser";

// A student's own progress page.
export async function myProgressLoader() {
  const user = await requireUser();
  if (user.role !== "student") {
    throw redirect("/dashboard");
  }
  const res = await fetch("/api/student/progress");
  const data = await res.json();
  return data.progress;
}
