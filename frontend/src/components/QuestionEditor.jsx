import { useRef, useState } from "react";
import {
  CircleAlert,
  CircleDot,
  ImagePlus,
  LoaderCircle,
  Plus,
  RefreshCw,
  SquareCheck,
  ToggleLeft,
  Trash2,
  Type,
  X,
} from "lucide-react";
import QuestionImage from "./QuestionImage";
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

      <ImageEditor question={question} onChange={onChange} />

      {(question.type === "single" || question.type === "multiple") && (
        <OptionsEditor question={question} onChange={onChange} />
      )}
      {question.type === "truefalse" && <TrueFalseEditor question={question} onChange={onChange} />}
      {question.type === "short" && <AcceptedAnswersEditor question={question} onChange={onChange} />}
    </fieldset>
  );
}

// The same limits the server checks; checking here too saves a wasted upload.
const IMAGE_TYPES = ["image/png", "image/jpeg", "image/gif", "image/webp"];
const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

// An optional image for the question: upload, preview, describe, replace or remove.
function ImageEditor({ question, onChange }) {
  const fileInput = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  async function upload(event) {
    const file = event.target.files[0];
    event.target.value = ""; // so choosing the same file again still triggers a change
    if (!file) return;
    if (!IMAGE_TYPES.includes(file.type)) {
      setError("Choose a PNG, JPEG, GIF or WebP image.");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setError("That image is too big. The limit is 2MB.");
      return;
    }

    setError(null);
    setUploading(true);
    try {
      // The file itself is the request body; the server checks what it really is.
      const res = await fetch("/api/images", {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
      } else {
        onChange({ imageId: data.imageId, imageAlt: question.imageAlt ?? "" });
      }
    } catch {
      setError("Couldn't upload the image. Check your connection and try again.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {/* The real file picker is hidden; our buttons open it with fileInput.current.click(). */}
      <input
        ref={fileInput}
        type="file"
        accept={IMAGE_TYPES.join(",")}
        onChange={upload}
        className="hidden"
      />

      {question.imageId ? (
        <div className="flex flex-col gap-2 rounded-md border border-gray-200 p-3">
          <QuestionImage imageId={question.imageId} imageAlt={question.imageAlt} className="" />
          <label className="flex flex-col gap-1 text-sm font-medium">
            Image description <span className="font-normal text-gray-500">(read aloud to students using screen readers)</span>
            <input
              value={question.imageAlt ?? ""}
              onChange={(event) => onChange({ imageAlt: event.target.value })}
              maxLength={300}
              placeholder="e.g. A right-angled triangle with sides of 3 cm and 4 cm"
              className={inputClass}
            />
          </label>
          <div className="flex gap-4 text-sm">
            <button
              type="button"
              onClick={() => fileInput.current.click()}
              disabled={uploading}
              className="inline-flex items-center gap-1 font-medium text-indigo-600 hover:underline disabled:opacity-50"
            >
              {uploading ? (
                <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw aria-hidden="true" className="h-4 w-4" />
              )}
              {uploading ? "Uploading..." : "Replace image"}
            </button>
            <button
              type="button"
              onClick={() => onChange({ imageId: null, imageAlt: null })}
              className="inline-flex items-center gap-1 font-medium text-red-600 hover:underline"
            >
              <Trash2 aria-hidden="true" className="h-4 w-4" />
              Remove image
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileInput.current.click()}
          disabled={uploading}
          className="inline-flex items-center gap-1 self-start text-sm font-medium text-indigo-600 hover:underline disabled:opacity-50"
        >
          {uploading ? (
            <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" />
          ) : (
            <ImagePlus aria-hidden="true" className="h-4 w-4" />
          )}
          {uploading ? "Uploading..." : "Add image"}
          <span className="font-normal text-gray-500">(optional, up to 2MB)</span>
        </button>
      )}

      {error && (
        <p className="flex items-center gap-2 text-sm text-red-700">
          <CircleAlert aria-hidden="true" className="h-4 w-4 shrink-0" />
          {error}
        </p>
      )}
    </div>
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
