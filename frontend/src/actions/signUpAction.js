import { redirect } from "react-router";

export async function signUpAction({ request }) {
  const formData = await request.formData();
  const fullname = formData.get("fullname").trim();
  const email = formData.get("email");
  const password = formData.get("password");
  const teacherCode = formData.get("teacherCode");

  const errors = {};
  if (!fullname) errors.fullname = "Enter your full name.";
  if (!email.includes("@")) errors.email = "Enter a valid email.";
  if (password.length < 6) errors.password = "Password must be at least 6 characters.";
  if (Object.keys(errors).length > 0) return errors;

  let res;
  try {
    res = await fetch("/api/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fullname, email, password, teacherCode }),
    });
  } catch {
    return { form: "Couldn't reach the server. Is the backend running?" };
  }

  if (!res.ok) {
    const data = await res.json();
    // 403 means the teacher code was wrong, so show the error under that box.
    if (res.status === 403) return { teacherCode: data.error };
    return { form: data.error };
  }

  return redirect("/dashboard");
}
