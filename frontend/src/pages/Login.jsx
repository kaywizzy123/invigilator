import { CircleAlert, LoaderCircle, LogIn, Mail } from "lucide-react";
import { Form, Link, useActionData, useNavigation } from "react-router";
import PasswordField from "../components/PasswordField";
import TextField from "../components/TextField";

export default function Login() {
  const errors = useActionData();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  return (
    <div className="mx-auto max-w-sm">
      <div className="flex flex-col gap-6 rounded-xl border border-gray-200 bg-white p-6 shadow-xl">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
            <LogIn aria-hidden="true" className="h-6 w-6" />
          </div>
          <h1 className="mt-3 text-2xl font-bold">Log in</h1>
          <p className="mt-1 text-sm text-gray-600">Welcome back to Invigilator.</p>
        </div>

        <Form method="post" className="flex flex-col gap-4">
          {errors?.form && (
            <p className="flex items-start gap-2 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
              <CircleAlert aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
              {errors.form}
            </p>
          )}
          <TextField
            label="Email"
            name="email"
            type="text"
            inputMode="email"
            autoComplete="email"
            placeholder="you@school.edu"
            icon={Mail}
            error={errors?.email}
          />
          <PasswordField
            label="Password"
            name="password"
            autoComplete="current-password"
            error={errors?.password}
          />
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center justify-center gap-2 rounded-md bg-gray-900 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
          >
            {isSubmitting ? (
              <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" />
            ) : (
              <LogIn aria-hidden="true" className="h-4 w-4" />
            )}
            {isSubmitting ? "Logging in..." : "Log in"}
          </button>
        </Form>

        <p className="text-center text-sm text-gray-600">
          No account?{" "}
          <Link to="/signup" className="font-medium text-blue-600 hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
