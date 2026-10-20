import { CalendarClock, ListChecks, Trophy } from "lucide-react";
import { useLoaderData } from "react-router";
import AnswerReview from "../components/AnswerReview";
import BackLink from "../components/BackLink";

export default function ExamResult() {
  const result = useLoaderData();
  const percent = Math.round((result.score / result.total) * 100);

  return (
    <div className="mx-auto max-w-2xl">
      <BackLink to="/dashboard">Back to dashboard</BackLink>

      <div className="mt-4 flex flex-col items-center rounded-xl border border-gray-200 bg-white p-8 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-amber-600">
          <Trophy aria-hidden="true" className="h-7 w-7" />
        </div>
        <h1 className="mt-3 text-xl font-bold">{result.title}</h1>
        <p className="mt-4 text-5xl font-bold">
          {result.score}
          <span className="text-2xl text-gray-400">/{result.total}</span>
        </p>
        <p className="mt-2 text-lg font-medium text-gray-700">{percent}%</p>
        <p className="mt-1 inline-flex items-center gap-1 text-sm text-gray-500">
          <CalendarClock aria-hidden="true" className="h-4 w-4" />
          Handed in {new Date(result.submittedAt).toLocaleString()}
        </p>
      </div>

      <h2 className="mt-8 mb-3 flex items-center gap-2 font-semibold">
        <ListChecks aria-hidden="true" className="h-5 w-5 text-gray-500" />
        Your answers
      </h2>
      <AnswerReview questions={result.questions} answerLabel="Your answer" />
    </div>
  );
}
