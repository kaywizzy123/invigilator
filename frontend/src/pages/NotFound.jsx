import { House, SearchX, TriangleAlert } from "lucide-react";
import { Link, isRouteErrorResponse, useRouteError } from "react-router";

export default function NotFound() {
  const error = useRouteError();
  const is404 = isRouteErrorResponse(error) && error.status === 404;
  const Icon = is404 ? SearchX : TriangleAlert;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 text-center text-gray-900">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-200 text-gray-500">
        <Icon aria-hidden="true" className="h-8 w-8" />
      </div>
      <h1 className="mt-4 text-4xl font-bold">{is404 ? "404" : "Oops!"}</h1>
      <p className="mt-2 text-gray-600">
        {is404 ? "Page not found." : "Something went wrong."}
      </p>
      <Link
        to="/"
        className="mt-6 inline-flex items-center gap-2 rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-gray-50 hover:bg-gray-700"
      >
        <House aria-hidden="true" className="h-4 w-4" />
        Go home
      </Link>
    </div>
  );
}
