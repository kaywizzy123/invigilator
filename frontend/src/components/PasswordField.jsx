import { useState } from "react";
import { Eye, EyeOff, Lock } from "lucide-react";

// A labelled password box with a lock icon, and an eye button to show or hide what's typed.
// Any other props (name, autoComplete...) are passed straight to the <input>.
export default function PasswordField({ label, hint, icon: Icon = Lock, error, ...inputProps }) {
  const [visible, setVisible] = useState(false);

  return (
    <label className="flex flex-col gap-1 text-sm font-medium">
      <span>
        {label} {hint && <span className="font-normal text-gray-500">{hint}</span>}
      </span>
      <div className="relative">
        <Icon
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400"
        />
        <input
          {...inputProps}
          // Switching the type between "password" and "text" is what hides or shows it.
          type={visible ? "text" : "password"}
          aria-invalid={error ? true : undefined}
          className={`w-full rounded-md border py-2 pr-10 pl-9 font-normal focus:outline-none focus:ring-2 focus:ring-indigo-600 ${
            error ? "border-red-400" : "border-gray-300"
          }`}
        />
        <button
          type="button" // not "submit": clicking the eye mustn't send the form
          onClick={() => setVisible(!visible)}
          aria-label={visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
          aria-pressed={visible}
          className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-1 text-gray-400 hover:text-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      {error && <span className="font-normal text-red-600">{error}</span>}
    </label>
  );
}
