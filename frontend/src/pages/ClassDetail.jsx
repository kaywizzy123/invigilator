import { useState } from "react";
import {
  Check,
  CircleAlert,
  Copy,
  KeyRound,
  Trash2,
  TriangleAlert,
  UserMinus,
  UserRound,
  Users,
} from "lucide-react";
import { Link, useActionData, useLoaderData, useSubmit } from "react-router";
import BackLink from "../components/BackLink";
import EmptyState from "../components/EmptyState";
import ConfirmDialog from "../components/ConfirmDialog";

export default function ClassDetail() {
  const schoolClass = useLoaderData();
  const submit = useSubmit();
  const [copied, setCopied] = useState(false);
  // The student waiting for "Remove" to be confirmed, or null.
  const [studentToRemove, setStudentToRemove] = useState(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  // The student waiting for "Reset password" to be confirmed, or null.
  const [studentToReset, setStudentToReset] = useState(null);

  // After a reset, the action returns the temporary password. It's shown until the teacher
  // clicks Done, which remembers that password as dismissed.
  const result = useActionData();
  const [dismissedPassword, setDismissedPassword] = useState(null);
  const [passwordCopied, setPasswordCopied] = useState(false);
  const newPassword =
    result?.temporaryPassword && result.temporaryPassword !== dismissedPassword ? result : null;

  // Published exams set only for this class: deleting it leaves them with no class.
  const examsLeftWithoutClass = schoolClass.exams.filter((exam) => exam.publishedAt && exam.classCount === 1);

  async function copyTemporaryPassword() {
    await navigator.clipboard.writeText(newPassword.temporaryPassword);
    setPasswordCopied(true);
    setTimeout(() => setPasswordCopied(false), 2000);
  }

  async function copyCode() {
    await navigator.clipboard.writeText(schoolClass.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="mx-auto max-w-2xl">
      <BackLink to="/classes">All classes</BackLink>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">{schoolClass.name}</h1>
        <button
          type="button"
          onClick={() => setConfirmingDelete(true)}
          className="inline-flex items-center gap-1 rounded-md border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50"
        >
          <Trash2 aria-hidden="true" className="h-4 w-4" />
          Delete class
        </button>
      </div>

      <section className="mt-6 rounded-xl border border-gray-200 bg-white p-8 text-center">
        <p className="inline-flex items-center gap-1 text-sm font-medium text-gray-500">
          <KeyRound aria-hidden="true" className="h-4 w-4" />
          Join code
        </p>
        <p className="mt-2 font-mono text-5xl font-bold tracking-[0.3em]">{schoolClass.code}</p>
        <p className="mt-3 text-sm text-gray-600">
          Students enter this code on their dashboard to join the class.
        </p>
        <button
          type="button"
          onClick={copyCode}
          className="mt-4 inline-flex items-center gap-2 rounded-md border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-100"
        >
          {copied ? (
            <Check aria-hidden="true" className="h-4 w-4 text-green-600" />
          ) : (
            <Copy aria-hidden="true" className="h-4 w-4" />
          )}
          {copied ? "Copied!" : "Copy code"}
        </button>
      </section>

      <h2 className="mt-8 mb-3 flex items-center gap-2 font-semibold">
        <Users aria-hidden="true" className="h-5 w-5 text-gray-500" />
        Students ({schoolClass.students.length})
      </h2>
      {schoolClass.students.length === 0 ? (
        <EmptyState icon={UserRound} title="No students yet" className="">
          They'll appear here as they join with the code.
        </EmptyState>
      ) : (
        <ul className="divide-y divide-gray-200 rounded-xl border border-gray-200 bg-white">
          {schoolClass.students.map((student) => (
            <li key={student.id} className="flex items-center justify-between px-6 py-3">
              <div>
                <Link
                  to={`/classes/${schoolClass.id}/students/${student.id}`}
                  className="font-medium text-blue-600 hover:underline"
                >
                  {student.fullname}
                </Link>
                <p className="text-sm text-gray-500">
                  {student.email} · joined {new Date(student.joinedAt).toLocaleDateString()}
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-end gap-x-4 gap-y-1">
                <button
                  type="button"
                  onClick={() => setStudentToReset(student)}
                  className="inline-flex items-center gap-1 text-sm font-medium text-gray-700 hover:underline"
                >
                  <KeyRound aria-hidden="true" className="h-4 w-4" />
                  Reset password
                </button>
                <button
                  type="button"
                  onClick={() => setStudentToRemove(student)}
                  className="inline-flex items-center gap-1 text-sm font-medium text-red-600 hover:underline"
                >
                  <UserMinus aria-hidden="true" className="h-4 w-4" />
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={studentToRemove !== null}
        title={`Remove ${studentToRemove?.fullname}?`}
        confirmLabel="Remove"
        danger
        onCancel={() => setStudentToRemove(null)}
        onConfirm={() => {
          submit({ intent: "remove", studentId: studentToRemove.id }, { method: "post" });
          setStudentToRemove(null);
        }}
      >
        They'll stop seeing this class's exams. Results from exams they've already sat are kept.
        They can join again with the code.
      </ConfirmDialog>

      {result?.error && (
        <p className="mt-4 flex items-center gap-2 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          <CircleAlert aria-hidden="true" className="h-4 w-4 shrink-0" />
          {result.error}
        </p>
      )}

      <ConfirmDialog
        open={studentToReset !== null}
        title={`Reset ${studentToReset?.fullname}'s password?`}
        confirmLabel="Reset password"
        onCancel={() => setStudentToReset(null)}
        onConfirm={() => {
          submit(
            { intent: "reset", studentId: studentToReset.id, studentName: studentToReset.fullname },
            { method: "post" },
          );
          setStudentToReset(null);
        }}
      >
        <p>
          You'll get a temporary password to give them. Their old password stops working, they're logged
          out on every device, and they'll choose a new password the next time they log in.
        </p>
      </ConfirmDialog>

      <ConfirmDialog
        open={newPassword !== null}
        title={`Temporary password for ${newPassword?.studentName}`}
        confirmLabel="Done"
        hideCancel
        onCancel={() => setDismissedPassword(newPassword.temporaryPassword)}
        onConfirm={() => setDismissedPassword(newPassword.temporaryPassword)}
      >
        <div className="mt-2 flex items-center justify-between gap-3 rounded-lg bg-gray-100 px-4 py-3">
          <span className="font-mono text-2xl font-bold tracking-widest text-gray-900">
            {newPassword?.temporaryPassword}
          </span>
          <button
            type="button"
            onClick={copyTemporaryPassword}
            className="inline-flex items-center gap-1 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium hover:bg-gray-50"
          >
            {passwordCopied ? (
              <Check aria-hidden="true" className="h-4 w-4 text-green-600" />
            ) : (
              <Copy aria-hidden="true" className="h-4 w-4" />
            )}
            {passwordCopied ? "Copied!" : "Copy"}
          </button>
        </div>
        <p className="mt-3 flex items-start gap-2 text-amber-800">
          <TriangleAlert aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
          Give this to the student now. It's only shown once; if it's lost, just reset again.
        </p>
      </ConfirmDialog>

      <ConfirmDialog
        open={confirmingDelete}
        title={`Delete ${schoolClass.name}?`}
        confirmLabel="Delete class"
        danger
        onCancel={() => setConfirmingDelete(false)}
        onConfirm={() => {
          submit(null, { method: "post", action: `/classes/${schoolClass.id}/delete` });
          setConfirmingDelete(false);
        }}
      >
        <p>
          The class, its join code and its list of {schoolClass.students.length}{" "}
          {schoolClass.students.length === 1 ? "student" : "students"} will be deleted. Students' accounts and
          the results of exams they've sat are kept. This can't be undone.
        </p>
        {examsLeftWithoutClass.length > 0 && (
          <div className="mt-3 rounded-md bg-amber-50 p-3 text-amber-800">
            <p className="flex items-center gap-1.5 font-medium">
              <TriangleAlert aria-hidden="true" className="h-4 w-4 shrink-0" />
              {examsLeftWithoutClass.length === 1 ? "This published exam" : "These published exams"} will
              have no class:
            </p>
            <ul className="mt-1 list-disc pl-6">
              {examsLeftWithoutClass.map((exam) => (
                <li key={exam.id}>{exam.title}</li>
              ))}
            </ul>
            <p className="mt-1">New students won't see them until you set another class.</p>
          </div>
        )}
      </ConfirmDialog>
    </div>
  );
}
