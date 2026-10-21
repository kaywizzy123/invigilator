import {
  ArrowRight,
  ChartColumn,
  ChevronRight,
  ClipboardList,
  GraduationCap,
  LayoutDashboard,
  LogIn,
  Timer,
  UserPlus,
  UserRound,
  Users,
} from "lucide-react";
import { Link, useRouteLoaderData } from "react-router";

const features = [
  {
    icon: ClipboardList,
    title: "Build exams in minutes",
    text: "Teachers write multiple-choice questions, set a time limit and publish when ready.",
  },
  {
    icon: Timer,
    title: "Timed and focused",
    text: "Students see one clear question at a time, with a countdown so nobody runs over.",
  },
  {
    icon: ChartColumn,
    title: "Instant results",
    text: "Answers are marked automatically. Students see their score and teachers see the whole class.",
  },
];

const steps = [
  { role: "Teacher", icon: UserRound, text: "Creates an exam and adds questions." },
  { role: "Student", icon: GraduationCap, text: "Logs in and takes the exam before the timer runs out." },
  { role: "Everyone", icon: Users, text: "Gets results the moment the exam is submitted." },
];

const options = ["Mitochondria", "Nucleus", "Ribosome", "Cell wall"];

function ExamPreview() {
  return (
    <div className="rounded-2xl border border-gray-200 bg-surface p-6 shadow-lg">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-gray-500">Biology · Question 3 of 20</span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 font-semibold text-amber-800">
          <Timer aria-hidden="true" className="h-4 w-4" />
          12:45
        </span>
      </div>
      <div className="mt-3 h-1.5 rounded-full bg-gray-100">
        <div className="h-1.5 w-[15%] rounded-full bg-indigo-600" />
      </div>
      <p className="mt-5 font-semibold">Which part of the cell produces energy?</p>
      <ul className="mt-4 space-y-2 text-sm">
        {options.map((option, i) => (
          <li
            key={option}
            className={`rounded-lg border px-4 py-2.5 ${
              i === 0
                ? "border-indigo-600 bg-indigo-50 font-medium text-indigo-700"
                : "border-gray-200 text-gray-700"
            }`}
          >
            {option}
          </li>
        ))}
      </ul>
      <div className="mt-5 flex justify-end">
        <span className="inline-flex items-center gap-1 rounded-md bg-gray-900 py-2 pr-3 pl-4 text-sm font-medium text-gray-50">
          Next question
          <ChevronRight aria-hidden="true" className="h-4 w-4" />
        </span>
      </div>
    </div>
  );
}

export default function Home() {
  const user = useRouteLoaderData("root");

  return (
    <div className="space-y-24 py-8">
      {/* Hero */}
      <section className="grid items-center gap-12 md:grid-cols-2">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600">
            Online exams for schools
          </p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
            Set, sit and mark exams without the paper.
          </h1>
          <p className="mt-5 text-lg text-gray-600">
            Invigilator gives teachers a simple way to run exams online and gives students
            their results the moment they finish.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            {user ? (
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-5 py-2.5 font-medium text-white hover:bg-indigo-500"
              >
                <LayoutDashboard aria-hidden="true" className="h-5 w-5" />
                Go to dashboard
              </Link>
            ) : (
              <>
                <Link
                  to="/signup"
                  className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-5 py-2.5 font-medium text-white hover:bg-indigo-500"
                >
                  <UserPlus aria-hidden="true" className="h-5 w-5" />
                  Get started
                </Link>
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-surface px-5 py-2.5 font-medium hover:bg-gray-100"
                >
                  <LogIn aria-hidden="true" className="h-5 w-5" />
                  Log in
                </Link>
              </>
            )}
          </div>
        </div>
        <ExamPreview />
      </section>

      {/* Features */}
      <section>
        <h2 className="text-center text-3xl font-bold">Everything an exam needs</h2>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {features.map((feature) => (
            <div key={feature.title} className="rounded-xl border border-gray-200 bg-surface p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                <feature.icon aria-hidden="true" className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-semibold">{feature.title}</h3>
              <p className="mt-2 text-sm text-gray-600">{feature.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section>
        <h2 className="text-center text-3xl font-bold">How it works</h2>
        <ol className="mt-10 grid gap-6 md:grid-cols-3">
          {steps.map((step, i) => (
            <li key={step.role} className="flex gap-4">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-600 font-semibold text-white">
                {i + 1}
              </span>
              <div>
                <h3 className="flex items-center gap-1.5 font-semibold">
                  <step.icon aria-hidden="true" className="h-4 w-4 text-gray-500" />
                  {step.role}
                </h3>
                <p className="mt-1 text-sm text-gray-600">{step.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* Call to action */}
      {!user && (
        <section className="rounded-2xl bg-gray-900 px-6 py-12 text-center text-gray-50">
          <h2 className="text-3xl font-bold">Ready for your next exam?</h2>
          <p className="mt-3 text-gray-300">Create a free account and set up your first exam today.</p>
          <Link
            to="/signup"
            className="mt-6 inline-flex items-center gap-2 rounded-md bg-surface px-5 py-2.5 font-medium text-gray-900 hover:bg-gray-200"
          >
            Get started
            <ArrowRight aria-hidden="true" className="h-5 w-5" />
          </Link>
        </section>
      )}
    </div>
  );
}
