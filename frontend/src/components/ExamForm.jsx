import { useState } from "react";
import { useActionData, useNavigation, useSubmit } from "react-router";
import { CircleAlert, LoaderCircle, Plus, Save } from "lucide-react";
import QuestionEditor from "./QuestionEditor";

// Each question gets an id so React can tell them apart when one is removed.
// New questions start as multiple choice with 4 empty options.
function blankQuestion() {
  return { id: crypto.randomUUID(), type: "single", text: "", options: ["", "", "", ""], answer: null };
}

// The exam form shared by the New exam and Edit exam pages.
// Pass `exam` to start from an existing exam; leave it out for a blank one.
export default function ExamForm({ exam, submitLabel, submittingLabel }) {
  const errors = useActionData();
  const navigation = useNavigation();
  const submit = useSubmit();
  const isSubmitting = navigation.state === "submitting";

  const [title, setTitle] = useState(exam?.title ?? "");
  const [timeLimitMinutes, setTimeLimitMinutes] = useState(String(exam?.timeLimitMinutes ?? 30));
  const [questions, setQuestions] = useState(exam?.questions ?? [blankQuestion()]);

  function addQuestion() {
    setQuestions([...questions, blankQuestion()]);
  }

  function removeQuestion(id) {
    setQuestions(questions.filter((question) => question.id !== id));
  }

  // Replace one question with a copy that has the changes applied.
  function updateQuestion(id, changes) {
    setQuestions(
      questions.map((question) => (question.id === id ? { ...question, ...changes } : question)),
    );
  }

  function handleSubmit(event) {
    event.preventDefault();
    submit(
      { title, timeLimitMinutes: Number(timeLimitMinutes), questions },
      { method: "post", encType: "application/json" },
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-6">
        <label className="flex flex-col gap-1 text-sm font-medium">
          Title
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            required
            placeholder="e.g. Year 9 Algebra"
            className="rounded-md border border-gray-300 px-3 py-2 font-normal"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Time limit (minutes)
          <input
            type="number"
            min="1"
            max="300"
            value={timeLimitMinutes}
            onChange={(event) => setTimeLimitMinutes(event.target.value)}
            required
            className="w-32 rounded-md border border-gray-300 px-3 py-2 font-normal"
          />
        </label>
      </div>

      {questions.map((question, questionIndex) => (
        <QuestionEditor
          key={question.id}
          question={question}
          number={questionIndex + 1}
          onChange={(changes) => updateQuestion(question.id, changes)}
          onRemove={() => removeQuestion(question.id)}
          canRemove={questions.length > 1}
        />
      ))}

      <button
        type="button"
        onClick={addQuestion}
        className="flex items-center justify-center gap-2 rounded-md border border-dashed border-gray-400 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
      >
        <Plus aria-hidden="true" className="h-4 w-4" />
        Add question
      </button>

      {errors?.form && (
        <p className="flex items-center gap-2 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          <CircleAlert aria-hidden="true" className="h-4 w-4 shrink-0" />
          {errors.form}
        </p>
      )}
      <button
        type="submit"
        disabled={isSubmitting}
        className="flex items-center justify-center gap-2 rounded-md bg-gray-900 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
      >
        {isSubmitting ? (
          <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" />
        ) : (
          <Save aria-hidden="true" className="h-4 w-4" />
        )}
        {isSubmitting ? submittingLabel : submitLabel}
      </button>
    </form>
  );
}
