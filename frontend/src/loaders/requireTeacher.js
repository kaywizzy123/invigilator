import { redirect } from "react-router";
import { requireUser } from "./requireUser";

// Use as the loader for teacher-only pages.
// Logged-out visitors go to /login; students go back to their dashboard.
export async function requireTeacher() {
  const user = await requireUser();
  if (user.role !== "teacher") {
    throw redirect("/dashboard");
  }
  return user;
}
