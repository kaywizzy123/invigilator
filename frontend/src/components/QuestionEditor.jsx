import { CircleDot, Plus, SquareCheck, ToggleLeft, Trash2, Type, X } from "lucide-react";
import Select from "./Select";

const OPTION_LETTERS = ["A", "B", "C", "D", "E", "F"];
const MIN_OPTIONS = 2;
const MAX_OPTIONS = 6;

const QUESTION_TYPES = [
  { value: "single", label: "Multiple choice (one answer)", icon: CircleDot },
  { value: "multiple", label: "Multiple answers (tick all that apply)", icon: SquareCheck },
  { value: "truefalse", label: "True / False", icon: ToggleLeft },
  { value: "short", label: "Short answer", icon: Type },
];

const inputClass = "rounded-md border border-gray-300 px-3 py-1.5 text-sm";

// The changes needed to switch a question to a new type. Options carry over between the two
// option types (and a single answer becomes a one-item list, or the other way round).
function changesForType(question, type) {
  const hasOptions = question.type === "single" || question.type === "multiple";
  const options = hasOptions ? question.options : ["", "", "", ""];
  switch (type) {
    case "single":
      return { type, options, answer: question.type === "multiple" ? (question.answer[0] ?? null) : null };
    case "multiple":
      return { type, options, answer: question.type === "single" && question.answer !== null ? [question.answer] : [] };
    case "truefalse":
      return { type, options: ["True", "False"], answer: null };
    default: // "short"
      return { type, options: [], answer: [""] };
  }
}

// One question in the exam form. `onChange(changes)` updates this question;
// `onRemove` removes it.
export default function QuestionEditor({ question, number, onChange, onRemove, canRemove }) {
  const TypeIcon = QUESTION_TYPES.find((type) => type.value === question.type).icon;

  return (
    <fieldset className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-6">
      <div className="flex items-center justify-between gap-4">
        <legend className="flex items-center gap-2 font-semibold">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-indigo-50 text-indigo-600">
            <TypeIcon aria-hidden="true" className="h-4 w-4" />
          </span>
          Question {number}
        </legend>
        <button
          type="button"
          onClick={onRemove}
          disabled={!canRemove}
          className="inline-flex items-center gap-1 text-sm text-red-600 hover:underline disabled:invisible"
        >
          <Trash2 aria-hidden="true" className="h-4 w-4" />
          Remove
        </button>
      </div>

      <label className="flex flex-col gap-1 text-sm font-medium">
        Type
        <Select value={question.type} onChange={(event) => onChange(changesForType(question, event.target.value))}>
          {QUESTION_TYPES.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </Select>
      </label>

      <textarea
        value={question.text}
        onChange={(event) => onChange({ text: event.target.value })}
        required
        rows={2}
        placeholder="Type the question"
        aria-label={`Question ${number}`}
        className="rounded-md border border-gray-300 px-3 py-2 text-sm"
      />

      {(question.type === "single" || question.type === "multiple") && (
        <OptionsEditor question={question} onChange={onChange} />
      )}
      {question.type === "truefalse" && <TrueFalseEditor question={question} onChange={onChange} />}
      {question.type === "short" && <AcceptedAnswersEditor question={question} onChange={onChange} />}
    </fieldset>
  );
}

// Options for multiple choice (pick one correct) and multiple answers (tick every correct one).
function OptionsEditor({ question, onChange }) {
  const isMultiple = question.type === "multiple";

  function isCorrect(optionIndex) {
    return isMultiple ? question.answer.includes(optionIndex) : question.answer === optionIndex;
  }

  function toggleCorrect(optionIndex) {
    if (!isMultiple) {
      onChange({ answer: optionIndex });
    } else if (question.answer.includes(optionIndex)) {
      onChange({ answer: question.answer.filter((index) => index !== optionIndex) });
    } else {
      onChange({ answer: [...question.answer, optionIndex].sort((a, b) => a - b) });
    }
  }

  function updateOption(optionIndex, value) {
    onChange({ options: question.options.map((option, index) => (index === optionIndex ? value : option)) });
  }

  // Removing an option moves the ones after it up a place, so the correct answer's
  // number has to move with them.
  function removeOption(optionIndex) {
    const options = question.options.filter((option, index) => index !== optionIndex);
    const shift = (index) => (index > optionIndex ? index - 1 : index);
    const answer = isMultiple
      ? question.answer.filter((index) => index !== optionIndex).map(shift)
      : question.answer === optionIndex || question.answer === null
        ? null
        : shift(question.answer);
    onChange({ options, answer });
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs text-gray-500">
        {isMultiple
          ? "Fill in the options and tick every correct one. Students must tick exactly these to get the mark."
          : "Fill in the options and pick the correct one."}
      </p>
      {question.options.map((option, optionIndex) => (
        <div key={optionIndex} className="flex items-center gap-3">
          <input
            type={isMultiple ? "checkbox" : "radio"}
            name={`correct-${question.id}`}
            checked={isCorrect(optionIndex)}
            onChange={() => toggleCorrect(optionIndex)}
            required={!isMultiple}
            aria-label={`Option ${OPTION_LETTERS[optionIndex]} is correct`}
          />
          <span className="w-4 text-sm font-medium text-gray-500">{OPTION_LETTERS[optionIndex]}</span>
          <input
            value={option}
            onChange={(event) => updateOption(optionIndex, event.target.value)}
            required
            aria-label={`Option ${OPTION_LETTERS[optionIndex]}`}
            className={`flex-1 ${inputClass}`}
          />
          <button
            type="button"
            onClick={() => removeOption(optionIndex)}
            disabled={question.options.length <= MIN_OPTIONS}
            aria-label={`Remove option ${OPTION_LETTERS[optionIndex]}`}
            className="text-gray-400 hover:text-red-600 disabled:invisible"
          >
            <X aria-hidden="true" className="h-4 w-4" />
          </button>
        </div>
      ))}
      {question.options.length < MAX_OPTIONS && (
        <button
          type="button"
          onClick={() => onChange({ options: [...question.options, ""] })}
          className="inline-flex items-center gap-1 self-start text-sm font-medium text-indigo-600 hover:underline"
        >
          <Plus aria-hidden="true" className="h-4 w-4" />
          Add option
        </button>
      )}
    </div>
  );
}

function TrueFalseEditor({ question, onChange }) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs text-gray-500">Pick the correct answer.</p>
      <div className="flex gap-3">
        {["True", "False"].map((label, optionIndex) => (
          <label
            key={label}
            className={`flex cursor-pointer items-center gap-2 rounded-md border px-4 py-2 text-sm ${
              question.answer === optionIndex ? "border-indigo-600 bg-indigo-50 font-medium" : "border-gray-300"
            }`}
          >
            <input
              type="radio"
              name={`correct-${question.id}`}
              checked={question.answer === optionIndex}
              onChange={() => onChange({ answer: optionIndex })}
              required
            />
            {label}
          </label>
        ))}
      </div>
    </div>
  );
}

// Short answer: the teacher lists every answer that should get the mark.
function AcceptedAnswersEditor({ question, onChange }) {
  function updateAnswer(answerIndex, value) {
    onChange({ answer: question.answer.map((answer, index) => (index === answerIndex ? value : answer)) });
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs text-gray-500">
        Accepted answers. A student gets the mark if they type any of these. Capitals and extra
        spaces don't matter, so "Abuja" also accepts "abuja".
      </p>
      {question.answer.map((answer, answerIndex) => (
        <div key={answerIndex} className="flex items-center gap-3">
          <input
            value={answer}
            onChange={(event) => updateAnswer(answerIndex, event.target.value)}
            required
            placeholder={answerIndex === 0 ? "e.g. 42" : "Another accepted answer, e.g. forty-two"}
            aria-label={`Accepted answer ${answerIndex + 1}`}
            className={`flex-1 ${inputClass}`}
          />
          <button
            type="button"
            onClick={() => onChange({ answer: question.answer.filter((item, index) => index !== answerIndex) })}
            disabled={question.answer.length <= 1}
            aria-label={`Remove accepted answer ${answerIndex + 1}`}
            className="text-gray-400 hover:text-red-600 disabled:invisible"
          >
            <X aria-hidden="true" className="h-4 w-4" />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange({ answer: [...question.answer, ""] })}
        className="inline-flex items-center gap-1 self-start text-sm font-medium text-indigo-600 hover:underline"
      >
        <Plus aria-hidden="true" className="h-4 w-4" />
        Add another accepted answer
      </button>
    </div>
  );
}
