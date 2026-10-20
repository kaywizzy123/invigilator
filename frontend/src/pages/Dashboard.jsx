import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Ban,
  CalendarDays,
  ChartColumn,
  CircleAlert,
  CircleCheck,
  ClipboardList,
  Clock,
  Copy,
  GraduationCap,
  Inbox,
  ListChecks,
  LoaderCircle,
  Lock,
  Pencil,
  PencilLine,
  Play,
  Plus,
  RotateCcw,
  Send,
  Trash2,
  TriangleAlert,
  Trophy,
  UserRound,
  Users,
} from "lucide-react";
import { Form, Link, useActionData, useLoaderData, useNavigation, useSubmit } from "react-router";
import ConfirmDialog from "../components/ConfirmDialog";
import EmptyState from "../components/EmptyState";

// Shared look for the small text buttons on each exam (Edit, Results, Duplicate...).
const actionClass = "inline-flex items-center gap-1 font-medium hover:underline";
const iconClass = "h-4 w-4";

export default function Dashboard() {
  const { user, exams, classes } = useLoaderData();
  const isTeacher = user.role === "teacher";

  return (
    <div>
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="mt-1 text-gray-600">
            Welcome, {user.fullname}.{" "}
            <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
              {isTeacher ? (
                <UserRound aria-hidden="true" className="h-3 w-3" />
              ) : (
                <GraduationCap aria-hidden="true" className="h-3 w-3" />
              )}
              {isTeacher ? "Teacher" : "Student"}
            </span>
          </p>
        </div>
        {isTeacher && (
          <Link
            to="/exams/new"
            className="inline-flex items-center gap-2 rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
          >
            <Plus aria-hidden="true" className={iconClass} />
            New exam
          </Link>
        )}
      </div>

      {isTeacher ? (
        <TeacherExams exams={exams} classes={classes} />
      ) : (
        <>
          <StudentClasses classes={classes} />
          <StudentExams exams={exams} />
        </>
      )}
    </div>
  );
}

// "10 questions · 20 min", each with a small icon.
function QuestionsAndTime({ exam }) {
  return (
    <>
      <span className="inline-flex items-center gap-1">
        <ListChecks aria-hidden="true" className="h-3.5 w-3.5" />
        {exam.questionCount} {exam.questionCount === 1 ? "question" : "questions"}
      </span>
      <span className="inline-flex items-center gap-1">
        <Clock aria-hidden="true" className="h-3.5 w-3.5" />
        {exam.timeLimitMinutes} min
      </span>
    </>
  );
}

// A small rounded label with an icon, e.g. Draft or Published.
function Badge({ icon: Icon, className, children }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${className}`}>
      <Icon aria-hidden="true" className="h-3 w-3" />
      {children}
    </span>
  );
}

// classes: all of this teacher's classes, to choose from.
function TeacherExams({ exams, classes }) {
  const submit = useSubmit();
  // The exam whose classes are being chosen, or null; and the ticked class ids.
  const [examForClasses, setExamForClasses] = useState(null);
  const [chosenClassIds, setChosenClassIds] = useState([]);
  // The exam waiting for "Publish" to be confirmed, or null when the dialog is closed.
  const [examToPublish, setExamToPublish] = useState(null);
  // The exam waiting for "Delete" to be confirmed, or null.
  const [examToDelete, setExamToDelete] = useState(null);
  // The exam waiting for "Close" to be confirmed, or null.
  const [examToClose, setExamToClose] = useState(null);

  function openClassPicker(exam) {
    setChosenClassIds(exam.classes.map((schoolClass) => schoolClass.id));
    setExamForClasses(exam);
  }

  function toggleClass(classId) {
    setChosenClassIds(
      chosenClassIds.includes(classId)
        ? chosenClassIds.filter((id) => id !== classId)
        : [...chosenClassIds, classId],
    );
  }

  if (exams.length === 0) {
    return (
      <EmptyState icon={ClipboardList} title="You haven't set any exams yet">
        Click <span className="font-medium">New exam</span> to create your first one.
      </EmptyState>
    );
  }

  return (
    <section className="mt-8">
      <h2 className="mb-3 font-semibold">Your exams</h2>
      <ul className="divide-y divide-gray-200 rounded-xl border border-gray-200 bg-white">
        {exams.map((exam) => (
          <li key={exam.id} className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 px-6 py-4">
            <div>
              <p className="flex flex-wrap items-center gap-2 font-medium">
                {exam.title}
                {exam.closedAt ? (
                  <Badge icon={Ban} className="bg-gray-200 text-gray-700">
                    Closed
                  </Badge>
                ) : exam.publishedAt ? (
                  <Badge icon={CircleCheck} className="bg-green-100 text-green-800">
                    Published
                  </Badge>
                ) : (
                  <Badge icon={PencilLine} className="bg-amber-100 text-amber-800">
                    Draft
                  </Badge>
                )}
              </p>
              <p className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-sm text-gray-600">
                <QuestionsAndTime exam={exam} />
                <span className="inline-flex items-center gap-1">
                  <CalendarDays aria-hidden="true" className="h-3.5 w-3.5" />
                  {new Date(exam.createdAt).toLocaleDateString()}
                </span>
              </p>
              <p className="mt-1 text-sm">
                {exam.classes.length > 0 ? (
                  <span className="inline-flex items-center gap-1 text-gray-600">
                    <Users aria-hidden="true" className="h-3.5 w-3.5" />
                    For {exam.classes.map((schoolClass) => schoolClass.name).join(", ")}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-amber-700">
                    <TriangleAlert aria-hidden="true" className="h-3.5 w-3.5" />
                    Not set for any class yet
                  </span>
                )}
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-x-4 gap-y-1 text-sm">
              {exam.attemptCount > 0 ? (
                <span
                  className="inline-flex items-center gap-1 text-gray-500"
                  title="Students have started this exam, so it can't be edited."
                >
                  <Lock aria-hidden="true" className={iconClass} />
                  Locked · {exam.attemptCount} {exam.attemptCount === 1 ? "student" : "students"}
                </span>
              ) : (
                <Link to={`/exams/${exam.id}/edit`} className={`${actionClass} text-blue-600`}>
                  <Pencil aria-hidden="true" className={iconClass} />
                  Edit
                </Link>
              )}
              {exam.publishedAt && (
                <Link to={`/exams/${exam.id}/results`} className={`${actionClass} text-indigo-600`}>
                  <ChartColumn aria-hidden="true" className={iconClass} />
                  Results
                </Link>
              )}
              <button
                type="button"
                onClick={() => openClassPicker(exam)}
                className={`${actionClass} text-gray-700`}
              >
                <Users aria-hidden="true" className={iconClass} />
                Classes
              </button>
              {!exam.publishedAt && (
                <button
                  type="button"
                  // No class yet? Choose classes first, since publishing needs at least one.
                  onClick={() =>
                    exam.classes.length > 0 ? setExamToPublish(exam) : openClassPicker(exam)
                  }
                  className={`${actionClass} text-green-700`}
                >
                  <Send aria-hidden="true" className={iconClass} />
                  Publish
                </button>
              )}
              <Form method="post" action={`/exams/${exam.id}/duplicate`}>
                <button type="submit" className={`${actionClass} text-gray-700`}>
                  <Copy aria-hidden="true" className={iconClass} />
                  Duplicate
                </button>
              </Form>
              {exam.publishedAt && !exam.closedAt && (
                <button
                  type="button"
                  onClick={() => setExamToClose(exam)}
                  className={`${actionClass} text-gray-700`}
                >
                  <Ban aria-hidden="true" className={iconClass} />
                  Close
                </button>
              )}
              {exam.closedAt && (
                <Form method="post" action={`/exams/${exam.id}/reopen`}>
                  <button type="submit" className={`${actionClass} text-green-700`}>
                    <RotateCcw aria-hidden="true" className={iconClass} />
                    Reopen
                  </button>
                </Form>
              )}
              {exam.attemptCount === 0 && (
                <button
                  type="button"
                  onClick={() => setExamToDelete(exam)}
                  className={`${actionClass} text-red-600`}
                >
                  <Trash2 aria-hidden="true" className={iconClass} />
                  Delete
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>

      <ConfirmDialog
        open={examToPublish !== null}
        title={`Publish "${examToPublish?.title}"?`}
        confirmLabel="Publish"
        onCancel={() => setExamToPublish(null)}
        onConfirm={() => {
          submit(null, { method: "post", action: `/exams/${examToPublish.id}/publish` });
          setExamToPublish(null);
        }}
      >
        Students in {examToPublish?.classes.map((schoolClass) => schoolClass.name).join(", ")} will be
        able to see and sit it. You can't unpublish it afterwards.
      </ConfirmDialog>

      <ConfirmDialog
        open={examForClasses !== null}
        title={`Classes for "${examForClasses?.title}"`}
        confirmLabel="Save"
        onCancel={() => setExamForClasses(null)}
        onConfirm={() => {
          // A published exam must keep at least one class.
          if (examForClasses.publishedAt && chosenClassIds.length === 0) return;
          submit(
            { classIds: chosenClassIds },
            { method: "post", action: `/exams/${examForClasses.id}/classes`, encType: "application/json" },
          );
          setExamForClasses(null);
        }}
      >
        {classes.length === 0 ? (
          <p>
            You haven't created any classes yet.{" "}
            <Link to="/classes" className="font-medium text-blue-600 hover:underline">
              Create a class
            </Link>{" "}
            first.
          </p>
        ) : (
          <>
            <p>Only students in the ticked classes can see and sit this exam.</p>
            <div className="mt-3 flex flex-col gap-2">
              {classes.map((schoolClass) => (
                <label
                  key={schoolClass.id}
                  className="flex cursor-pointer items-center gap-3 rounded-md border border-gray-200 px-3 py-2 text-gray-900 hover:bg-gray-50"
                >
                  <input
                    type="checkbox"
                    checked={chosenClassIds.includes(schoolClass.id)}
                    onChange={() => toggleClass(schoolClass.id)}
                  />
                  <span className="flex-1">{schoolClass.name}</span>
                  <span className="text-xs text-gray-500">
                    {schoolClass.studentCount} {schoolClass.studentCount === 1 ? "student" : "students"}
                  </span>
                </label>
              ))}
            </div>
            {examForClasses?.publishedAt && chosenClassIds.length === 0 && (
              <p className="mt-3 text-red-700">A published exam must be set for at least one class.</p>
            )}
            {!examForClasses?.publishedAt && (
              <p className="mt-3 text-xs text-gray-500">You need at least one class before you can publish.</p>
            )}
          </>
        )}
      </ConfirmDialog>

      <ConfirmDialog
        open={examToDelete !== null}
        title={`Delete "${examToDelete?.title}"?`}
        confirmLabel="Delete exam"
        danger
        onCancel={() => setExamToDelete(null)}
        onConfirm={() => {
          submit(null, { method: "post", action: `/exams/${examToDelete.id}/delete` });
          setExamToDelete(null);
        }}
      >
        The exam and all {examToDelete?.questionCount} of its questions will be deleted. This can't be undone.
      </ConfirmDialog>

      <ConfirmDialog
        open={examToClose !== null}
        title={`Close "${examToClose?.title}"?`}
        confirmLabel="Close exam"
        onCancel={() => setExamToClose(null)}
        onConfirm={() => {
          submit(null, { method: "post", action: `/exams/${examToClose.id}/close` });
          setExamToClose(null);
        }}
      >
        Students who haven't started won't be able to. Anyone sitting it now can still finish, and
        all results are kept. You can reopen it later.
      </ConfirmDialog>
    </section>
  );
}

function StudentClasses({ classes }) {
  const result = useActionData();
  const navigation = useNavigation();
  // Only this form sends a "code", so this ignores other submits on the page (like Start).
  const isJoining = navigation.state === "submitting" && navigation.formData?.has("code");

  // Empty the code box after joining.
  const joinForm = useRef(null);
  useEffect(() => {
    if (result?.joined) joinForm.current.reset();
  }, [result]);

  return (
    <section className="mt-8 rounded-xl border border-gray-200 bg-white p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2 font-semibold">
            <Users aria-hidden="true" className="h-5 w-5 text-gray-500" />
            Your classes
          </h2>
          {classes.length === 0 ? (
            <p className="mt-1 text-sm text-gray-600">
              You're not in any classes yet. Ask your teacher for a class code.
            </p>
          ) : (
            <ul className="mt-2 flex flex-wrap gap-2">
              {classes.map((schoolClass) => (
                <li
                  key={schoolClass.id}
                  title={`Teacher: ${schoolClass.teacherName}`}
                  className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-3 py-1 text-sm font-medium text-indigo-700"
                >
                  <GraduationCap aria-hidden="true" className="h-3.5 w-3.5" />
                  {schoolClass.name}
                </li>
              ))}
            </ul>
          )}
        </div>
        <Form method="post" ref={joinForm} className="flex gap-2">
          <input
            name="code"
            required
            placeholder="Class code"
            aria-label="Class code"
            autoComplete="off"
            className="w-32 rounded-md border border-gray-300 px-3 py-2 font-mono text-sm uppercase placeholder:normal-case"
          />
          <button
            type="submit"
            disabled={isJoining}
            className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
          >
            {isJoining ? (
              <LoaderCircle aria-hidden="true" className={`${iconClass} animate-spin`} />
            ) : (
              <Plus aria-hidden="true" className={iconClass} />
            )}
            {isJoining ? "Joining..." : "Join class"}
          </button>
        </Form>
      </div>
      {result?.joinError && (
        <p className="mt-3 flex items-center gap-2 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          <CircleAlert aria-hidden="true" className={`${iconClass} shrink-0`} />
          {result.joinError}
        </p>
      )}
      {result?.joined && (
        <p className="mt-3 flex items-center gap-2 rounded-md bg-green-50 px-3 py-2 text-sm text-green-800">
          <CircleCheck aria-hidden="true" className={`${iconClass} shrink-0`} />
          You've joined {result.joined}.
        </p>
      )}
    </section>
  );
}

function StudentExams({ exams }) {
  const submit = useSubmit();
  // The exam waiting for "Start" to be confirmed, or null when the dialog is closed.
  const [examToStart, setExamToStart] = useState(null);

  if (exams.length === 0) {
    return (
      <EmptyState icon={Inbox} title="No exams to sit yet">
        When a teacher sets an exam for one of your classes, it will show up here.
      </EmptyState>
    );
  }

  return (
    <section className="mt-8">
      <h2 className="mb-3 font-semibold">Your exams</h2>
      <ul className="divide-y divide-gray-200 rounded-xl border border-gray-200 bg-white">
        {exams.map((exam) => (
          <li key={exam.id} className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 px-6 py-4">
            <div>
              <p className="font-medium">{exam.title}</p>
              <p className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-sm text-gray-600">
                <QuestionsAndTime exam={exam} />
                <span className="inline-flex items-center gap-1">
                  <UserRound aria-hidden="true" className="h-3.5 w-3.5" />
                  {exam.teacherName}
                </span>
              </p>
            </div>
            <div className="text-sm">
              {exam.submittedAt ? (
                <Link
                  to={`/exams/${exam.id}/result`}
                  className="inline-flex items-center gap-2 rounded-md bg-green-100 px-4 py-2 font-medium text-green-800 hover:bg-green-200"
                >
                  <Trophy aria-hidden="true" className={iconClass} />
                  {exam.score}/{exam.questionCount} · View result
                </Link>
              ) : exam.closedAt && !exam.startedAt ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-gray-200 px-3 py-1 font-medium text-gray-700">
                  <Ban aria-hidden="true" className={iconClass} />
                  Closed
                </span>
              ) : exam.startedAt ? (
                <Link
                  to={`/exams/${exam.id}/sit`}
                  className="inline-flex items-center gap-2 rounded-md bg-amber-500 px-4 py-2 font-medium text-white hover:bg-amber-600"
                >
                  <ArrowRight aria-hidden="true" className={iconClass} />
                  Continue
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => setExamToStart(exam)}
                  className="inline-flex items-center gap-2 rounded-md bg-gray-900 px-4 py-2 font-medium text-white hover:bg-gray-700"
                >
                  <Play aria-hidden="true" className={iconClass} />
                  Start
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>

      <ConfirmDialog
        open={examToStart !== null}
        title={`Start "${examToStart?.title}"?`}
        confirmLabel="Start exam"
        onCancel={() => setExamToStart(null)}
        onConfirm={() => {
          submit(null, { method: "post", action: `/exams/${examToStart.id}/start` });
          setExamToStart(null);
        }}
      >
        <ul className="list-disc space-y-1 pl-5">
          <li>You'll have {examToStart?.timeLimitMinutes} minutes.</li>
          <li>The timer can't be paused once you start.</li>
          <li>You can only sit this exam once.</li>
        </ul>
      </ConfirmDialog>
    </section>
  );
}
