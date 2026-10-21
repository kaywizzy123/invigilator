// The colour theme: "light", "dark", or "system" (follow the computer's setting).
// The choice is saved in this browser only. index.html applies it before the page draws.

const STORAGE_KEY = "theme";
const systemDark = window.matchMedia("(prefers-color-scheme: dark)");

export function getSavedTheme() {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? "system";
  } catch {
    return "system"; // e.g. storage blocked in a private window
  }
}

export function saveTheme(theme) {
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // Not saved, but the theme still applies until the page is closed.
  }
}

// Adds or removes the "dark" class on <html>, which switches the colours.
export function applyTheme(theme) {
  const dark = theme === "dark" || (theme === "system" && systemDark.matches);
  document.documentElement.classList.toggle("dark", dark);
}

// Calls `listener` whenever the computer switches between light and dark.
// Returns a function that stops listening.
export function onSystemThemeChange(listener) {
  systemDark.addEventListener("change", listener);
  return () => systemDark.removeEventListener("change", listener);
}
