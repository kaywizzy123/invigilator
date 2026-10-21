import { useEffect, useState } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { applyTheme, getSavedTheme, onSystemThemeChange, saveTheme } from "../theme";

// Each click moves to the next theme in this order.
const THEMES = [
  { value: "system", label: "System", icon: Monitor },
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
];

export default function ThemeToggle() {
  const [theme, setTheme] = useState(getSavedTheme);

  // Apply the theme whenever it changes. On "system", also follow the computer if it
  // switches while the page is open (e.g. dark mode turning on in the evening).
  useEffect(() => {
    applyTheme(theme);
    if (theme !== "system") return;
    return onSystemThemeChange(() => applyTheme("system"));
  }, [theme]);

  const index = THEMES.findIndex((item) => item.value === theme);
  const current = THEMES[index === -1 ? 0 : index];
  const next = THEMES[(THEMES.indexOf(current) + 1) % THEMES.length];
  const Icon = current.icon;

  function changeTheme() {
    saveTheme(next.value);
    setTheme(next.value);
  }

  return (
    <button
      type="button"
      onClick={changeTheme}
      aria-label={`Theme: ${current.label}. Switch to ${next.label}`}
      title={`Theme: ${current.label}`}
      className="flex items-center rounded-md p-1.5 hover:bg-gray-100 hover:text-gray-900"
    >
      <Icon aria-hidden="true" className="h-4 w-4" />
    </button>
  );
}
