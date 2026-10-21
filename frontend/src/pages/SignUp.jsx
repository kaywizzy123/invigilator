import { CircleAlert, KeyRound, LoaderCircle, Mail, User, UserPlus } from "lucide-react";
import { Form, Link, useActionData, useNavigation } from "react-router";
import PasswordField from "../components/PasswordField";
import TextField from "../components/TextField";

export default function SignUp() {
  const errors = useActionData();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  return (
    <div className="mx-auto max-w-sm">
      <div className="flex flex-col gap-6 rounded-xl border border-gray-200 bg-surface p-6 shadow-xl">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
            <UserPlus aria-hidden="true" className="h-6 w-6" />
          </div>
          <h1 className="mt-3 text-2xl font-bold">Sign up</h1>
          <p className="mt-1 text-sm text-gray-600">Create your Invigilator account.</p>
        </div>

        <Form method="post" className="flex flex-col gap-4">
          {errors?.form && (
            <p className="flex items-start gap-2 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
              <CircleAlert aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
              {errors.form}
            </p>
          )}
          <TextField
            label="Full name"
            name="fullname"
            type="text"
            autoComplete="name"
            placeholder="e.g. Ada Okafor"
            icon={User}
            error={errors?.fullname}
          />
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
            hint="(at least 6 characters)"
            name="password"
            autoComplete="new-password"
            error={errors?.password}
          />
          <div className="flex flex-col gap-1">
            <PasswordField
              label="Teacher code"
              hint="(teachers only)"
              name="teacherCode"
              autoComplete="off"
              icon={KeyRound}
              error={errors?.teacherCode}
            />
            <p className="text-xs text-gray-500">Students: leave this empty.</p>
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center justify-center gap-2 rounded-md bg-gray-900 py-2 text-sm font-medium text-gray-50 hover:bg-gray-700 disabled:opacity-50"
          >
            {isSubmitting ? (
              <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" />
            ) : (
              <UserPlus aria-hidden="true" className="h-4 w-4" />
            )}
            {isSubmitting ? "Creating account..." : "Sign up"}
          </button>
        </Form>

        <p className="text-center text-sm text-gray-600">
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-blue-600 hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
