import { requireTeacher } from "./requireTeacher";

// The teacher's classes, for the Classes page.
export async function classesLoader() {
  await requireTeacher();
  const res = await fetch("/api/classes");
  const data = await res.json();
  return data.classes;
}
