import { Mail, TrendingUp, Users } from "lucide-react";
import { useLoaderData, useParams } from "react-router";
import BackLink from "../components/BackLink";
import ProgressView from "../components/ProgressView";

// A teacher's view of one student: their scores on this teacher's exams.
export default function StudentProgress() {
  const progress = useLoaderData();
  const { classId } = useParams();

  return (
    <div className="mx-auto max-w-3xl">
      <BackLink to={`/classes/${classId}`}>Back to {progress.className}</BackLink>
      <h1 className="mt-4 flex items-center gap-2 text-2xl font-bold">
        <TrendingUp aria-hidden="true" className="h-6 w-6 text-indigo-600" />
        {progress.fullname}
      </h1>
      <p className="mt-1 mb-6 flex flex-wrap gap-x-3 text-sm text-gray-600">
        <span className="inline-flex items-center gap-1">
          <Mail aria-hidden="true" className="h-3.5 w-3.5" />
          {progress.email}
        </span>
        <span className="inline-flex items-center gap-1">
          <Users aria-hidden="true" className="h-3.5 w-3.5" />
          {progress.className}
        </span>
        <span>Scores on your exams</span>
      </p>
      <ProgressView
        exams={progress.exams}
        linkTo={(exam) => `/exams/${exam.examId}/results/${exam.attemptId}`}
      />
    </div>
  );
}
