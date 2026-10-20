import { redirect } from "react-router";

export async function setPasswordAction({ request }) {
  const formData = await request.formData();
  const newPassword = formData.get("newPassword");
  const confirmPassword = formData.get("confirmPassword");

  const errors = {};
  if (newPassword.length < 6) errors.newPassword = "Your new password must be at least 6 characters.";
  else if (newPassword !== confirmPassword) errors.confirmPassword = "The two passwords don't match.";
  if (Object.keys(errors).length > 0) return errors;

  let res;
  try {
    res = await fetch("/api/me/new-password", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ newPassword }),
    });
  } catch {
    return { form: "Couldn't reach the server. Is the backend running?" };
  }

  if (!res.ok) {
    const data = await res.json();
    return { form: data.error };
  }
  return redirect("/dashboard");
}
