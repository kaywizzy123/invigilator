import { useEffect, useRef } from "react";
import {
  CalendarDays,
  CircleAlert,
  CircleCheck,
  CircleUserRound,
  GraduationCap,
  KeyRound,
  LoaderCircle,
  Lock,
  Mail,
  Save,
  User,
  UserRound,
} from "lucide-react";
import { Form, useActionData, useLoaderData, useNavigation } from "react-router";
import PasswordField from "../components/PasswordField";
import TextField from "../components/TextField";

// A green or red message under a form.
function FormMessage({ result }) {
  if (result?.error) {
    return (
      <p className="flex items-center gap-2 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
        <CircleAlert aria-hidden="true" className="h-4 w-4 shrink-0" />
        {result.error}
      </p>
    );
  }
  if (result?.success) {
    return (
      <p className="flex items-center gap-2 rounded-md bg-green-50 px-3 py-2 text-sm text-green-800">
        <CircleCheck aria-hidden="true" className="h-4 w-4 shrink-0" />
        {result.success}
      </p>
    );
  }
  return null;
}

export default function Profile() {
  const user = useLoaderData();
  const result = useActionData();
  const navigation = useNavigation();
  // Which form is being sent right now, if any: "details" or "password".
  const sending = navigation.state === "submitting" ? navigation.formData?.get("intent") : null;

  // Empty the password boxes after a successful change.
  const passwordForm = useRef(null);
  useEffect(() => {
    if (result?.password?.success) passwordForm.current.reset();
  }, [result]);

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="flex items-center gap-2 text-2xl font-bold">
        <CircleUserRound aria-hidden="true" className="h-6 w-6 text-indigo-600" />
        Profile
      </h1>

      <section className="mt-6 flex items-center gap-4 rounded-xl border border-gray-200 bg-surface p-6">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-xl font-semibold text-white">
          {user.fullname.charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="text-lg font-semibold">{user.fullname}</p>
          <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-gray-600">
            <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
              {user.role === "teacher" ? (
                <UserRound aria-hidden="true" className="h-3 w-3" />
              ) : (
                <GraduationCap aria-hidden="true" className="h-3 w-3" />
              )}
              {user.role === "teacher" ? "Teacher" : "Student"}
            </span>
            <span className="inline-flex items-center gap-1">
              <CalendarDays aria-hidden="true" className="h-3.5 w-3.5" />
              Member since {new Date(user.createdAt).toLocaleDateString()}
            </span>
          </p>
        </div>
      </section>

      <section className="mt-6 rounded-xl border border-gray-200 bg-surface p-6">
        <h2 className="flex items-center gap-2 font-semibold">
          <User aria-hidden="true" className="h-5 w-5 text-gray-500" />
          Your details
        </h2>
        <Form method="post" className="mt-4 flex flex-col gap-4">
          <input type="hidden" name="intent" value="details" />
          <TextField
            label="Full name"
            name="fullname"
            defaultValue={user.fullname}
            required
            autoComplete="name"
            icon={User}
          />
          <TextField
            label="Email"
            name="email"
            type="email"
            defaultValue={user.email}
            required
            autoComplete="email"
            icon={Mail}
          />
          <FormMessage result={result?.details} />
          <button
            type="submit"
            disabled={sending === "details"}
            className="inline-flex items-center gap-2 self-start rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-gray-50 hover:bg-gray-700 disabled:opacity-50"
          >
            {sending === "details" ? (
              <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" />
            ) : (
              <Save aria-hidden="true" className="h-4 w-4" />
            )}
            {sending === "details" ? "Saving..." : "Save details"}
          </button>
        </Form>
      </section>

      <section className="mt-6 rounded-xl border border-gray-200 bg-surface p-6">
        <h2 className="flex items-center gap-2 font-semibold">
          <Lock aria-hidden="true" className="h-5 w-5 text-gray-500" />
          Change password
        </h2>
        <Form method="post" ref={passwordForm} className="mt-4 flex flex-col gap-4">
          <input type="hidden" name="intent" value="password" />
          <PasswordField
            label="Current password"
            name="currentPassword"
            required
            autoComplete="current-password"
          />
          <PasswordField
            label="New password"
            hint="(at least 6 characters)"
            name="newPassword"
            required
            minLength={6}
            autoComplete="new-password"
            icon={KeyRound}
          />
          <PasswordField
            label="Confirm new password"
            name="confirmPassword"
            required
            minLength={6}
            autoComplete="new-password"
            icon={KeyRound}
          />
          <FormMessage result={result?.password} />
          <button
            type="submit"
            disabled={sending === "password"}
            className="inline-flex items-center gap-2 self-start rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-gray-50 hover:bg-gray-700 disabled:opacity-50"
          >
            {sending === "password" ? (
              <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" />
            ) : (
              <KeyRound aria-hidden="true" className="h-4 w-4" />
            )}
            {sending === "password" ? "Changing..." : "Change password"}
          </button>
        </Form>
      </section>
    </div>
  );
}
