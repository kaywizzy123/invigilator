// A student joins a class with the code their teacher gave them.
export async function joinClassAction({ request }) {
  const formData = await request.formData();
  const code = formData.get("code");

  let res;
  try {
    res = await fetch("/api/student/classes/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
  } catch {
    return { joinError: "Couldn't reach the server. Is the backend running?" };
  }

  const data = await res.json();
  if (!res.ok) return { joinError: data.error };
  return { joined: data.class.name };
}
