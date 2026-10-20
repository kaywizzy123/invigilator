import { requireUser } from "./requireUser";

// Loads everything the dashboard shows: the user, plus their exams.
// Teachers get the exams they've set and their classes; students get the published
// exams they can sit and the classes they're in.
export async function dashboardLoader() {
  const user = await requireUser();

  if (user.role === "teacher") {
    // The teacher's classes are needed to choose which classes an exam is for.
    const [exams, classes] = await Promise.all([
      getList("/api/exams", "exams"),
      getList("/api/classes", "classes"),
    ]);
    return { user, exams, classes };
  }

  // Promise.all runs both requests at the same time, rather than one after the other.
  const [exams, classes] = await Promise.all([
    getList("/api/student/exams", "exams"),
    getList("/api/student/classes", "classes"),
  ]);
  return { user, exams, classes };
}

// Fetches a list from the backend, or an empty list if that fails.
async function getList(url, key) {
  const res = await fetch(url);
  if (!res.ok) return [];
  const data = await res.json();
  return data[key];
}
