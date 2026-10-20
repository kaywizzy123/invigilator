import { redirect } from "react-router";
import { rootLoader } from "./rootLoader";

// Use as the loader for any page that needs a logged-in user.
// Sends visitors to /login before the page renders, and anyone on a temporary
// password (after a teacher's reset) to choose a new one first.
export async function requireUser() {
  const user = await rootLoader();
  if (!user) {
    throw redirect("/login");
  }
  if (user.mustChangePassword) {
    throw redirect("/set-password");
  }
  return user;
}
