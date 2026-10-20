import { TrendingUp } from "lucide-react";
import { useLoaderData } from "react-router";
import ProgressView from "../components/ProgressView";

// A student's own scores across all their exams.
export default function MyProgress() {
  const progress = useLoaderData();

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="flex items-center gap-2 text-2xl font-bold">
        <TrendingUp aria-hidden="true" className="h-6 w-6 text-indigo-600" />
        My progress
      </h1>
      <p className="mt-1 mb-6 text-gray-600">Your scores on every exam you've handed in.</p>
      <ProgressView exams={progress.exams} linkTo={(exam) => `/exams/${exam.examId}/result`} showTeacher />
    </div>
  );
}
