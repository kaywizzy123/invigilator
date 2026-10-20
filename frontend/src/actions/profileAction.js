// The profile page has two forms. Each sends a hidden "intent" field,
// so this one action knows which form was submitted.
export async function profileAction({ request }) {
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "details") {
    return saveDetails(formData);
  }
  if (intent === "password") {
    return changePassword(formData);
  }
  return null;
}

async function saveDetails(formData) {
  const fullname = formData.get("fullname").trim();
  const email = formData.get("email").trim();
  if (!fullname || !email.includes("@")) {
    return { details: { error: "Enter your full name and a valid email." } };
  }

  return send("/api/me", { fullname, email }, "details", "Your details have been saved.");
}

async function changePassword(formData) {
  const currentPassword = formData.get("currentPassword");
  const newPassword = formData.get("newPassword");
  const confirmPassword = formData.get("confirmPassword");
  if (newPassword.length < 6) {
    return { password: { error: "Your new password must be at least 6 characters." } };
  }
  if (newPassword !== confirmPassword) {
    return { password: { error: "The two new passwords don't match." } };
  }

  return send(
    "/api/me/password",
    { currentPassword, newPassword },
    "password",
    "Your password has been changed. Any other devices have been logged out.",
  );
}

// Sends the change to the backend. The result is filed under `form`
// ("details" or "password") so each form only shows its own message.
async function send(url, body, form, successMessage) {
  let res;
  try {
    res = await fetch(url, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    return { [form]: { error: "Couldn't reach the server. Is the backend running?" } };
  }

  if (!res.ok) {
    const data = await res.json();
    return { [form]: { error: data.error } };
  }
  return { [form]: { success: successMessage } };
}
