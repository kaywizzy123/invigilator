import { CircleAlert, GraduationCap, KeyRound, LifeBuoy, LoaderCircle, Mail } from "lucide-react";
import { Form, Link, useActionData, useNavigation } from "react-router";
import PasswordField from "../components/PasswordField";
import TextField from "../components/TextField";

export default function ForgotPassword() {
  const errors = useActionData();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  return (
    <div className="mx-auto max-w-sm">
      <div className="flex flex-col gap-6 rounded-xl border border-gray-200 bg-white p-6 shadow-xl">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
            <LifeBuoy aria-hidden="true" className="h-6 w-6" />
          </div>
          <h1 className="mt-3 text-2xl font-bold">Forgot your password?</h1>
        </div>

        <p className="flex items-start gap-2 rounded-md bg-gray-50 px-3 py-2 text-sm text-gray-700">
          <GraduationCap aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-gray-500" />
          <span>
            <span className="font-medium">Students:</span> ask your teacher to reset your password. They'll
            give you a temporary one.
          </span>
        </p>

        <Form method="post" className="flex flex-col gap-4">
          <p className="text-sm text-gray-600">
            <span className="font-medium text-gray-900">Teachers:</span> set a new password using your
            school's teacher code.
          </p>
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
            label="Teacher code"
            name="teacherCode"
            autoComplete="off"
            icon={KeyRound}
            error={errors?.teacherCode}
          />
          <PasswordField
            label="New password"
            hint="(at least 6 characters)"
            name="newPassword"
            autoComplete="new-password"
            error={errors?.newPassword}
          />
          <PasswordField
            label="Confirm new password"
            name="confirmPassword"
            autoComplete="new-password"
            error={errors?.confirmPassword}
          />
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center justify-center gap-2 rounded-md bg-gray-900 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
          >
            {isSubmitting ? (
              <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" />
            ) : (
              <KeyRound aria-hidden="true" className="h-4 w-4" />
            )}
            {isSubmitting ? "Resetting..." : "Reset password and log in"}
          </button>
        </Form>

        <p className="text-center text-sm text-gray-600">
          Remembered it?{" "}
          <Link to="/login" className="font-medium text-blue-600 hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
