import { redirect } from "react-router";

// A teacher sets a new password using the school's teacher code.
export async function forgotPasswordAction({ request }) {
  const formData = await request.formData();
  const email = formData.get("email").trim();
  const teacherCode = formData.get("teacherCode");
  const newPassword = formData.get("newPassword");
  const confirmPassword = formData.get("confirmPassword");

  const errors = {};
  if (!email.includes("@")) errors.email = "Enter a valid email.";
  if (!teacherCode) errors.teacherCode = "Enter the teacher code.";
  if (newPassword.length < 6) errors.newPassword = "Your new password must be at least 6 characters.";
  else if (newPassword !== confirmPassword) errors.confirmPassword = "The two passwords don't match.";
  if (Object.keys(errors).length > 0) return errors;

  let res;
  try {
    res = await fetch("/api/teacher-reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, teacherCode, newPassword }),
    });
  } catch {
    return { form: "Couldn't reach the server. Is the backend running?" };
  }

  if (!res.ok) {
    const data = await res.json();
    return { form: data.error };
  }
  // The backend logs the teacher straight in.
  return redirect("/dashboard");
}
