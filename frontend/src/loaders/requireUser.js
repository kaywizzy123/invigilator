import { redirect } from "react-router";
import { rootLoader } from "./rootLoader";

// Use as the loader for any page that needs a logged-in user.
// Sends visitors to /login before the page renders.
export async function requireUser() {
  const user = await rootLoader();
  if (!user) {
    throw redirect("/login");
  }
  return user;
}
