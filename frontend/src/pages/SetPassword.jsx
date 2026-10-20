import { CircleAlert, KeyRound, LoaderCircle, LogOut } from "lucide-react";
import { Form, useActionData, useLoaderData, useNavigation } from "react-router";
import PasswordField from "../components/PasswordField";

// Shown after logging in with a temporary password from a teacher.
// The rest of the app stays closed until a new password is chosen.
export default function SetPassword() {
  const user = useLoaderData();
  const errors = useActionData();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  return (
    <div className="mx-auto max-w-sm">
      <div className="flex flex-col gap-6 rounded-xl border border-gray-200 bg-white p-6 shadow-xl">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
            <KeyRound aria-hidden="true" className="h-6 w-6" />
          </div>
          <h1 className="mt-3 text-2xl font-bold">Choose a new password</h1>
          <p className="mt-1 text-sm text-gray-600">
            Hi {user.fullname}, your password was reset. Choose your own to continue. Only you will know it.
          </p>
        </div>

        <Form method="post" className="flex flex-col gap-4">
          {errors?.form && (
            <p className="flex items-start gap-2 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
              <CircleAlert aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
              {errors.form}
            </p>
          )}
          <PasswordField
            label="New password"
            hint="(at least 6 characters)"
            name="newPassword"
            autoComplete="new-password"
            icon={KeyRound}
            error={errors?.newPassword}
          />
          <PasswordField
            label="Confirm new password"
            name="confirmPassword"
            autoComplete="new-password"
            icon={KeyRound}
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
            {isSubmitting ? "Saving..." : "Save and continue"}
          </button>
        </Form>

        <Form method="post" action="/logout" className="text-center">
          <button type="submit" className="inline-flex items-center gap-1 text-sm text-gray-600 hover:underline">
            <LogOut aria-hidden="true" className="h-4 w-4" />
            Not you? Log out
          </button>
        </Form>
      </div>
    </div>
  );
}
