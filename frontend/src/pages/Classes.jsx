import { ChevronRight, CircleAlert, LoaderCircle, Plus, Users } from "lucide-react";
import { Form, Link, useActionData, useLoaderData, useNavigation } from "react-router";
import EmptyState from "../components/EmptyState";

export default function Classes() {
  const classes = useLoaderData();
  const result = useActionData();
  const navigation = useNavigation();
  const isCreating = navigation.state === "submitting";

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="flex items-center gap-2 text-2xl font-bold">
        <Users aria-hidden="true" className="h-6 w-6 text-indigo-600" />
        Classes
      </h1>
      <p className="mt-1 text-gray-600">
        Students join a class with its code. You then set exams for one or more classes.
      </p>

      <Form method="post" className="mt-6 flex gap-2">
        <input
          name="name"
          required
          placeholder="New class name, e.g. Year 9A"
          aria-label="New class name"
          className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={isCreating}
          className="inline-flex items-center gap-2 rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-gray-50 hover:bg-gray-700 disabled:opacity-50"
        >
          {isCreating ? (
            <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" />
          ) : (
            <Plus aria-hidden="true" className="h-4 w-4" />
          )}
          {isCreating ? "Creating..." : "Create class"}
        </button>
      </Form>
      {result?.error && (
        <p className="mt-2 flex items-center gap-2 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          <CircleAlert aria-hidden="true" className="h-4 w-4 shrink-0" />
          {result.error}
        </p>
      )}

      {classes.length === 0 ? (
        <EmptyState icon={Users} title="No classes yet">
          Create one above, then give your students its join code.
        </EmptyState>
      ) : (
        <ul className="mt-8 divide-y divide-gray-200 rounded-xl border border-gray-200 bg-surface">
          {classes.map((schoolClass) => (
            <li key={schoolClass.id}>
              <Link
                to={`/classes/${schoolClass.id}`}
                className="flex items-center justify-between px-6 py-4 hover:bg-gray-50"
              >
                <div>
                  <p className="font-medium">{schoolClass.name}</p>
                  <p className="inline-flex items-center gap-1 text-sm text-gray-600">
                    <Users aria-hidden="true" className="h-3.5 w-3.5" />
                    {schoolClass.studentCount} {schoolClass.studentCount === 1 ? "student" : "students"}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="rounded-md bg-gray-100 px-3 py-1 font-mono text-sm font-semibold tracking-widest">
                    {schoolClass.code}
                  </span>
                  <ChevronRight aria-hidden="true" className="h-4 w-4 text-gray-400" />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
