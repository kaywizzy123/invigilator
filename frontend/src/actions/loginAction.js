import { redirect } from "react-router";

export async function loginAction({ request }) {
  const formData = await request.formData();
  const email = formData.get("email");
  const password = formData.get("password");

  const errors = {};
  if (!email.includes("@")) errors.email = "Enter a valid email.";
  if (!password) errors.password = "Enter your password.";
  if (Object.keys(errors).length > 0) return errors;

  let res;
  try {
    res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
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
