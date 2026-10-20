import { Check, CircleCheck, CircleDashed, CircleX } from "lucide-react";
import QuestionImage from "./QuestionImage";

const OPTION_LETTERS = ["A", "B", "C", "D", "E", "F"];

// Every question with the given answer and the correct one, for a handed-in exam.
// Used by the student's result page and the teacher's view of one student.
// answerLabel: what to call the given answer, e.g. "Your answer" or "Their answer".
// Each question has `correct` (worked out by the server), `answer` (the right answer)
// and `yourAnswer` (what was given, or null).
export default function AnswerReview({ questions, answerLabel }) {
  return (
    <div className="flex flex-col gap-4">
      {questions.map((question, questionIndex) => {
        const notAnswered =
          question.yourAnswer === null || (Array.isArray(question.yourAnswer) && question.yourAnswer.length === 0);
        return (
          <div key={question.id} className="rounded-xl border border-gray-200 bg-white p-6">
            <div className="mb-4 flex items-start justify-between gap-4">
              <p className="font-medium">
                <span className="text-gray-500">{questionIndex + 1}.</span> {question.text}
              </p>
              <span
                className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                  question.correct ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                }`}
              >
                {question.correct ? (
                  <CircleCheck aria-hidden="true" className="h-3 w-3" />
                ) : notAnswered ? (
                  <CircleDashed aria-hidden="true" className="h-3 w-3" />
                ) : (
                  <CircleX aria-hidden="true" className="h-3 w-3" />
                )}
                {question.correct ? "Correct" : notAnswered ? "Not answered" : "Wrong"}
              </span>
            </div>
            <QuestionImage imageId={question.imageId} imageAlt={question.imageAlt} className="mb-4" />
            {question.type === "short" ? (
              <ShortAnswerReview question={question} answerLabel={answerLabel} />
            ) : (
              <OptionsReview question={question} answerLabel={answerLabel} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// Options questions: green for correct options, red for wrongly chosen ones.
function OptionsReview({ question, answerLabel }) {
  const isMultiple = question.type === "multiple";
  return (
    <>
      {isMultiple && (
        <p className="mb-2 text-xs text-gray-500">Tick all that apply: every correct option was needed for the mark.</p>
      )}
      <ul className="flex flex-col gap-2">
        {question.options.map((option, position) => {
          const isCorrect = isMultiple ? question.answer.includes(option.index) : option.index === question.answer;
          const isChosen = isMultiple
            ? (question.yourAnswer ?? []).includes(option.index)
            : option.index === question.yourAnswer;
          return (
            <li
              key={option.index}
              className={`flex items-center gap-3 rounded-md border px-3 py-2 text-sm ${
                isCorrect ? "border-green-300 bg-green-50" : isChosen ? "border-red-300 bg-red-50" : "border-gray-200"
              }`}
            >
              {question.type !== "truefalse" && (
                <span className="w-4 font-medium text-gray-500">{OPTION_LETTERS[position]}</span>
              )}
              <span className="flex-1">{option.text}</span>
              {isChosen && <span className="text-xs font-medium text-gray-600">{answerLabel}</span>}
              {isCorrect && (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700">
                  <Check aria-hidden="true" className="h-3.5 w-3.5" />
                  Correct answer
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </>
  );
}

// Short answer: what was typed, and the answers that would have got the mark.
function ShortAnswerReview({ question, answerLabel }) {
  return (
    <div className="flex flex-col gap-2 text-sm">
      <p
        className={`rounded-md border px-3 py-2 ${
          question.correct ? "border-green-300 bg-green-50" : "border-red-300 bg-red-50"
        }`}
      >
        <span className="text-xs font-medium text-gray-600">{answerLabel}: </span>
        {question.yourAnswer === null ? <em className="text-gray-500">nothing typed</em> : `"${question.yourAnswer}"`}
      </p>
      <p className="text-gray-600">
        <span className="inline-flex items-center gap-1 font-medium text-green-700">
          <Check aria-hidden="true" className="h-3.5 w-3.5" />
          Accepted:
        </span>{" "}
        {question.answer.join(", ")}
      </p>
    </div>
  );
}
