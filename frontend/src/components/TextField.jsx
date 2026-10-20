// A labelled text box with an icon inside it on the left.
// `icon` is a lucide-react icon component, e.g. Mail. Any other props (name, type,
// autoComplete, placeholder...) are passed straight to the <input>.
export default function TextField({ label, hint, icon: Icon, error, ...inputProps }) {
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
          aria-invalid={error ? true : undefined}
          className={`w-full rounded-md border py-2 pr-3 pl-9 font-normal focus:outline-none focus:ring-2 focus:ring-indigo-600 ${
            error ? "border-red-400" : "border-gray-300"
          }`}
        />
      </div>
      {error && <span className="font-normal text-red-600">{error}</span>}
    </label>
  );
}
