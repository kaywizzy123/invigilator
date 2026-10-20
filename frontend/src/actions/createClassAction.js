import { redirect } from "react-router";

export async function createClassAction({ request }) {
  const formData = await request.formData();
  const name = formData.get("name").trim();
  if (!name) return { error: "Give the class a name." };

  let res;
  try {
    res = await fetch("/api/classes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
  } catch {
    return { error: "Couldn't reach the server. Is the backend running?" };
  }

  const data = await res.json();
  if (!res.ok) return { error: data.error };
  // Go straight to the new class, to see its join code.
  return redirect(`/classes/${data.class.id}`);
}
