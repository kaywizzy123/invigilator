// Runs before the app renders: asks the backend who is logged in.
// Returns the user, or null if nobody is logged in.
export async function rootLoader() {
  try {
    const res = await fetch("/api/me");
    if (!res.ok) return null;
    const data = await res.json();
    return data.user;
  } catch {
    return null; // backend not running: treat as logged out
  }
}
