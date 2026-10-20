import { FilePlus } from "lucide-react";
import ExamForm from "../components/ExamForm";

export default function NewExam() {
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 flex items-center gap-2 text-2xl font-bold">
        <FilePlus aria-hidden="true" className="h-6 w-6 text-indigo-600" />
        New exam
      </h1>
      <ExamForm submitLabel="Save exam" submittingLabel="Saving exam..." />
    </div>
  );
}
