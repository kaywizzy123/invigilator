// The "nothing here yet" box: a large soft icon, a heading and a line of help.
// `icon` is a lucide-react icon component. `children` is the help text (and any links).
export default function EmptyState({ icon: Icon, title, children, className = "mt-8" }) {
  return (
    <section
      className={`${className} flex flex-col items-center rounded-xl border border-dashed border-gray-300 bg-surface p-10 text-center`}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-gray-400">
        <Icon aria-hidden="true" className="h-7 w-7" />
      </div>
      <h2 className="mt-4 font-semibold">{title}</h2>
      {children && <div className="mt-1 text-sm text-gray-600">{children}</div>}
    </section>
  );
}
