import { redirect } from "react-router";
import { rootLoader } from "./rootLoader";

// The "choose a new password" page is only for someone logged in on a temporary password.
export async function setPasswordLoader() {
  const user = await rootLoader();
  if (!user) {
    throw redirect("/login");
  }
  if (!user.mustChangePassword) {
    throw redirect("/dashboard");
  }
  return user;
}
