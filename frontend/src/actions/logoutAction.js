import { redirect } from "react-router";

export async function logoutAction() {
  await fetch("/api/logout", { method: "POST" });
  return redirect("/login");
}
