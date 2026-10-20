import { CalendarClock, Hourglass, ListChecks, Mail, Users } from "lucide-react";
import { useLoaderData, useParams } from "react-router";
import AnswerReview from "../components/AnswerReview";
import BackLink from "../components/BackLink";

// The teacher's view of one student's attempt.
export default function StudentAnswers() {
  const attempt = useLoaderData();
  const { examId } = useParams();
  const handedIn = Boolean(attempt.submittedAt);

  return (
    <div className="mx-auto max-w-2xl">
      <BackLink to={`/exams/${examId}/results`}>Back to results</BackLink>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-gray-200 bg-white p-6">
        <div>
          <p className="text-sm text-gray-500">{attempt.examTitle}</p>
          <h1 className="text-xl font-bold">{attempt.fullname}</h1>
          <p className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-sm text-gray-600">
            <span className="inline-flex items-center gap-1">
              <Mail aria-hidden="true" className="h-3.5 w-3.5" />
              {attempt.email}
            </span>
            {attempt.classes.length > 0 && (
              <span className="inline-flex items-center gap-1">
                <Users aria-hidden="true" className="h-3.5 w-3.5" />
                {attempt.classes.map((schoolClass) => schoolClass.name).join(", ")}
              </span>
            )}
          </p>
          <p className="mt-1 inline-flex items-center gap-1 text-sm text-gray-500">
            {handedIn ? (
              <CalendarClock aria-hidden="true" className="h-3.5 w-3.5" />
            ) : (
              <Hourglass aria-hidden="true" className="h-3.5 w-3.5" />
            )}
            {handedIn
              ? `Handed in ${new Date(attempt.submittedAt).toLocaleString()}`
              : `Started ${new Date(attempt.startedAt).toLocaleString()} · still sitting`}
          </p>
        </div>
        {handedIn && (
          <p className="text-4xl font-bold">
            {attempt.score}
            <span className="text-xl text-gray-400">/{attempt.total}</span>
          </p>
        )}
      </div>

      <h2 className="mt-8 mb-1 flex items-center gap-2 font-semibold">
        <ListChecks aria-hidden="true" className="h-5 w-5 text-gray-500" />
        Answers
      </h2>
      <p className="mb-3 text-sm text-gray-600">
        In the order this student saw them{handedIn ? "" : ", saved so far"}.
      </p>
      <AnswerReview questions={attempt.questions} answerLabel="Their answer" />
    </div>
  );
}
