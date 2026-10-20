import { ArrowLeft } from "lucide-react";
import { Link } from "react-router";

// A small "← Back to ..." link at the top of a page.
export default function BackLink({ to, children }) {
  return (
    <Link to={to} className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline">
      <ArrowLeft aria-hidden="true" className="h-4 w-4" />
      {children}
    </Link>
  );
}
