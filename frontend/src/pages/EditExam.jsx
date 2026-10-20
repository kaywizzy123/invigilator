import { FilePen } from "lucide-react";
import { useLoaderData } from "react-router";
import ExamForm from "../components/ExamForm";

export default function EditExam() {
  const exam = useLoaderData();

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 flex items-center gap-2 text-2xl font-bold">
        <FilePen aria-hidden="true" className="h-6 w-6 text-indigo-600" />
        Edit exam
      </h1>
      {/* key: start the form afresh if we move to a different exam's edit page */}
      <ExamForm
        key={exam.id}
        exam={exam}
        submitLabel="Save changes"
        submittingLabel="Saving changes..."
      />
    </div>
  );
}
