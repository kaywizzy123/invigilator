import { useEffect, useId, useRef } from "react";
import { TriangleAlert } from "lucide-react";

// A pop-up box that asks the user to confirm something.
// Built on the browser's <dialog> element, which gives us the dark backdrop,
// keeps keyboard focus inside the box, and closes on Escape.
export default function ConfirmDialog({
  open,
  title,
  children,
  confirmLabel,
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
  danger = false, // true for actions that can't be undone: makes the button red
}) {
  const dialogRef = useRef(null);
  const titleId = useId();

  // `open` (from the parent's state) decides whether the dialog shows.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onCancel={(event) => {
        // Escape was pressed. Let the parent's state close the dialog, so they stay in step.
        event.preventDefault();
        onCancel();
      }}
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl bg-white p-0 text-gray-900 shadow-xl backdrop:bg-gray-900/50"
    >
      <div className="p-6">
        <h2 id={titleId} className="flex items-start gap-3 text-lg font-semibold">
          {danger && (
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
              <TriangleAlert aria-hidden="true" className="h-4 w-4" />
            </span>
          )}
          <span className={danger ? "pt-0.5" : undefined}>{title}</span>
        </h2>
        <div className="mt-2 text-sm text-gray-600">{children}</div>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            autoFocus={danger} // for risky actions, Enter cancels instead of confirming
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-100"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            autoFocus={!danger}
            className={`rounded-md px-4 py-2 text-sm font-medium text-white ${
              danger ? "bg-red-600 hover:bg-red-500" : "bg-indigo-600 hover:bg-indigo-500"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </dialog>
  );
}
