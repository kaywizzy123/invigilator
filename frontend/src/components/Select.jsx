import { ChevronDown } from "lucide-react";

// A dropdown with our own arrow. Browsers draw their own arrow in different places and
// ignore our padding, so `appearance-none` hides it and a ChevronDown sits on top instead.
// Any props (value, onChange, aria-label...) are passed straight to the <select>.
export default function Select({ children, ...selectProps }) {
  return (
    <div className="relative">
      <select
        {...selectProps}
        className="w-full appearance-none rounded-md border border-gray-300 bg-surface py-2 pr-9 pl-3 font-normal focus:outline-none focus:ring-2 focus:ring-indigo-600"
      >
        {children}
      </select>
      {/* pointer-events-none: clicks go through the arrow to the dropdown underneath */}
      <ChevronDown
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 text-gray-500"
      />
    </div>
  );
}
