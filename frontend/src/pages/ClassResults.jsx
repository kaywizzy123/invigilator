import { useState } from "react";
import {
  ChartColumn,
  CircleCheck,
  Clock,
  Download,
  Filter,
  Hourglass,
  ListChecks,
  Send,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react";
import { Link, useLoaderData } from "react-router";
import BackLink from "../components/BackLink";
import Select from "../components/Select";
import EmptyState from "../components/EmptyState";

function percentOf(score, total) {
  return Math.round((score / total) * 100);
}

function Stat({ icon: Icon, label, value, className = "" }) {
  return (
    <div className={`rounded-xl border border-gray-200 bg-surface p-4 ${className}`}>
      <p className="flex items-center gap-1.5 text-sm text-gray-500">
        <Icon aria-hidden="true" className="h-4 w-4" />
        {label}
      </p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
    </div>
  );
}

// "Handed in" or "Sitting now".
function StatusBadge({ student }) {
  return student.submittedAt ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium whitespace-nowrap text-green-800">
      <CircleCheck aria-hidden="true" className="h-3 w-3" />
      Handed in
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium whitespace-nowrap text-amber-800">
      <Hourglass aria-hidden="true" className="h-3 w-3" />
      Sitting now
    </span>
  );
}

export default function ClassResults() {
  const { exam, students: everyone, questions } = useLoaderData();
  const total = exam.questionCount;

  // "all", or a class id. Everything below is worked out from the chosen class's students.
  const [classId, setClassId] = useState("all");
  const students =
    classId === "all"
      ? everyone
      : everyone.filter((student) => student.classes.some((schoolClass) => schoolClass.id === classId));

  const handedIn = students.filter((student) => student.submittedAt);
  const inProgress = students.length - handedIn.length;
  const scores = handedIn.map((student) => student.score);
  const average = scores.length > 0 ? scores.reduce((sum, score) => sum + score, 0) / scores.length : null;

  return (
    <div>
      <BackLink to="/dashboard">Back to dashboard</BackLink>
      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold">
            <ChartColumn aria-hidden="true" className="h-6 w-6 text-indigo-600" />
            {exam.title}: results
          </h1>
          <p className="mt-1 flex flex-wrap gap-x-3 text-gray-600">
            <span className="inline-flex items-center gap-1">
              <ListChecks aria-hidden="true" className="h-4 w-4" />
              {total} {total === 1 ? "question" : "questions"}
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock aria-hidden="true" className="h-4 w-4" />
              {exam.timeLimitMinutes} min
            </span>
          </p>
        </div>
        {everyone.length > 0 && (
          // A plain <a>, not <Link>: this downloads a file from the backend
          // instead of moving to another page in the app.
          <a
            href={`/api/exams/${exam.id}/results.csv${classId === "all" ? "" : `?classId=${classId}`}`}
            download
            className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-surface px-4 py-2 text-sm font-medium hover:bg-gray-100"
          >
            <Download aria-hidden="true" className="h-4 w-4" />
            Download CSV
          </a>
        )}
      </div>

      {exam.classes.length > 0 && (
        <label className="mt-6 flex items-center gap-3 text-sm font-medium">
          <Filter aria-hidden="true" className="h-4 w-4 text-gray-500" />
          Show
          <Select value={classId} onChange={(event) => setClassId(event.target.value)}>
            <option value="all">All classes</option>
            {exam.classes.map((schoolClass) => (
              <option key={schoolClass.id} value={schoolClass.id}>
                {schoolClass.name}
              </option>
            ))}
          </Select>
        </label>
      )}

      {students.length === 0 ? (
        <EmptyState
          icon={Users}
          title={classId === "all" ? "No one has sat this exam yet" : "No one in this class has sat this exam yet"}
        >
          Results will show up here as students hand in.
        </EmptyState>
      ) : (
        <>
          <section className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
            <Stat icon={Send} label="Handed in" value={handedIn.length} />
            <Stat icon={Hourglass} label="Still sitting" value={inProgress} />
            <Stat icon={ChartColumn} label="Average" value={average === null ? "–" : `${percentOf(average, total)}%`} />
            <Stat icon={TrendingUp} label="Highest" value={scores.length > 0 ? `${Math.max(...scores)}/${total}` : "–"} />
            {/* On phones (2 per row) the fifth box spans the row, instead of sitting alone. */}
            <Stat
              icon={TrendingDown}
              label="Lowest"
              value={scores.length > 0 ? `${Math.min(...scores)}/${total}` : "–"}
              className="col-span-2 sm:col-span-1"
            />
          </section>

          <section className="mt-8">
            <h2 className="mb-3 flex items-center gap-2 font-semibold">
              <Users aria-hidden="true" className="h-5 w-5 text-gray-500" />
              Students
            </h2>
            {/* Phones: one card per student. */}
            <ul className="divide-y divide-gray-200 rounded-xl border border-gray-200 bg-surface sm:hidden">
              {students.map((student) => (
                <li key={student.id}>
                  <Link
                    to={`/exams/${exam.id}/results/${student.id}`}
                    className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-gray-50"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-blue-600">{student.fullname}</p>
                      <p className="truncate text-sm text-gray-500">{student.email}</p>
                      <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-gray-600">
                        <StatusBadge student={student} />
                        {student.classes.map((schoolClass) => schoolClass.name).join(", ")}
                      </p>
                    </div>
                    <div className="shrink-0 text-right tabular-nums">
                      <p className="font-semibold">
                        {student.submittedAt ? `${percentOf(student.score, total)}%` : "–"}
                      </p>
                      <p className="text-sm text-gray-500">{student.submittedAt ? `${student.score}/${total}` : ""}</p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>

            {/* Tablets and up: the full table. */}
            <div className="hidden overflow-x-auto rounded-xl border border-gray-200 bg-surface sm:block">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-gray-200 bg-gray-50 text-gray-600">
                  <tr>
                    <th className="px-4 py-3 font-medium">Student</th>
                    <th className="px-4 py-3 font-medium">Class</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 text-right font-medium">Score</th>
                    <th className="px-4 py-3 text-right font-medium">%</th>
                    <th className="px-4 py-3 font-medium">Handed in</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {students.map((student) => (
                    <tr key={student.id}>
                      <td className="px-4 py-3">
                        <Link
                          to={`/exams/${exam.id}/results/${student.id}`}
                          className="font-medium text-blue-600 hover:underline"
                        >
                          {student.fullname}
                        </Link>
                        <p className="text-gray-500">{student.email}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {student.classes.length > 0
                          ? student.classes.map((schoolClass) => schoolClass.name).join(", ")
                          : "–"}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge student={student} />
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {student.submittedAt ? `${student.score}/${total}` : "–"}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {student.submittedAt ? `${percentOf(student.score, total)}%` : "–"}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {student.submittedAt ? new Date(student.submittedAt).toLocaleString() : "–"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {handedIn.length > 0 && (
            <section className="mt-8">
              <h2 className="flex items-center gap-2 font-semibold">
                <ListChecks aria-hidden="true" className="h-5 w-5 text-gray-500" />
                Questions
              </h2>
              <p className="mb-3 text-sm text-gray-600">
                How many students got each question right. Low numbers may mean a question was too hard or unclear.
              </p>
              <ol className="divide-y divide-gray-200 rounded-xl border border-gray-200 bg-surface">
                {questions.map((question, index) => {
                  // How many of the chosen students got this question right.
                  const correctCount = handedIn.filter((student) =>
                    student.correctQuestionIds.includes(question.id),
                  ).length;
                  const percent = percentOf(correctCount, handedIn.length);
                  return (
                    <li key={question.id} className="flex items-center gap-4 px-4 py-3 text-sm">
                      <span className="w-6 text-gray-500">{index + 1}.</span>
                      <span className="flex-1">{question.text}</span>
                      <div className="hidden h-2 w-32 rounded-full bg-gray-100 sm:block">
                        <div
                          className={`h-2 rounded-full ${percent < 50 ? "bg-red-500" : "bg-indigo-600"}`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                      <span className="w-28 text-right tabular-nums text-gray-600">
                        {correctCount}/{handedIn.length} right
                      </span>
                    </li>
                  );
                })}
              </ol>
            </section>
          )}
        </>
      )}
    </div>
  );
}
