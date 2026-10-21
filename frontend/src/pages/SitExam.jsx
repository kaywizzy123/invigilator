import { useEffect, useRef, useState } from "react";
import {
  Link,
  useActionData,
  useBlocker,
  useLoaderData,
  useNavigation,
  useSubmit,
} from "react-router";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  CircleCheckBig,
  Hourglass,
  LoaderCircle,
  Send,
  Timer,
  Trophy,
} from "lucide-react";
import ConfirmDialog from "../components/ConfirmDialog";
import QuestionImage from "../components/QuestionImage";

const OPTION_LETTERS = ["A", "B", "C", "D", "E", "F"];

// Short answers save once the student pauses typing for this long, not on every key press.
const TYPING_PAUSE_MS = 700;

// Has the student given an answer? Nothing ticked, or only spaces typed, doesn't count.
function isAnswered(answer) {
  if (Array.isArray(answer)) return answer.length > 0;
  if (typeof answer === "string") return answer.trim() !== "";
  return answer !== undefined && answer !== null;
}

// 125 seconds -> "2:05"
function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export default function SitExam() {
  const { exam, attempt } = useLoaderData();
  if (attempt.submittedAt) {
    return <HandedIn exam={exam} />;
  }
  return <ExamInProgress exam={exam} attempt={attempt} />;
}

function HandedIn({ exam }) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center rounded-xl border border-gray-200 bg-surface p-10 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-600">
        <CircleCheckBig aria-hidden="true" className="h-7 w-7" />
      </div>
      <h1 className="mt-4 text-xl font-bold">Exam handed in</h1>
      <p className="mt-2 text-gray-600">
        Your answers to <span className="font-medium">{exam.title}</span> have been handed in.
      </p>
      <Link
        to={`/exams/${exam.id}/result`}
        className="mt-6 inline-flex items-center gap-2 rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-gray-50 hover:bg-gray-700"
      >
        <Trophy aria-hidden="true" className="h-4 w-4" />
        See your result
      </Link>
    </div>
  );
}

function ExamInProgress({ exam, attempt }) {
  const errors = useActionData();
  const navigation = useNavigation();
  const submit = useSubmit();
  const isHandingIn = navigation.state !== "idle";

  const [answers, setAnswers] = useState(attempt.answers);
  const [saveError, setSaveError] = useState(null);
  const [confirmingHandIn, setConfirmingHandIn] = useState(false);

  // Which question is on screen (0 = the first). Start at the first unanswered one,
  // so pressing Continue picks up where the student left off.
  const [current, setCurrent] = useState(() => {
    const firstUnanswered = exam.questions.findIndex((question) => !(question.id in attempt.answers));
    return firstUnanswered === -1 ? 0 : firstUnanswered;
  });

  // When time runs out, on this computer's clock. Based on the server's secondsLeft.
  const [endTime] = useState(() => Date.now() + attempt.secondsLeft * 1000);
  const [now, setNow] = useState(() => Date.now());
  const secondsLeft = Math.max(0, Math.ceil((endTime - now) / 1000));
  const timeUp = secondsLeft === 0;

  // useRef keeps a value between renders without causing a re-render when it changes.
  const saving = useRef(Promise.resolve()); // the queue of answers being saved
  const handedIn = useRef(false); // stops us handing in twice

  // Tick once a second so the countdown updates.
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer); // stop ticking when the page closes
  }, []);

  // Stop in-app navigation (navbar links, Log out, the Back button) until the exam is handed in.
  // React Router asks this function before every navigation; true means "block it".
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      !handedIn.current && currentLocation.pathname !== nextLocation.pathname,
  );

  // Closing the tab, refreshing or typing a new address can't be blocked by a website,
  // but this makes the browser ask "Leave site?" first.
  useEffect(() => {
    function warnBeforeLeaving(event) {
      event.preventDefault();
    }
    window.addEventListener("beforeunload", warnBeforeLeaving);
    return () => window.removeEventListener("beforeunload", warnBeforeLeaving);
  }, []);

  // Saves one answer to the server. Saves go one at a time, in order, so an older answer
  // can't arrive after (and overwrite) a newer one.
  function queueSave(questionId, answer) {
    saving.current = saving.current.then(async () => {
      try {
        const res = await fetch(`/api/student/exams/${exam.id}/answers`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ questionId, answer }),
        });
        if (res.ok) {
          setSaveError(null);
        } else {
          const data = await res.json();
          setSaveError(data.error);
        }
      } catch {
        setSaveError("Couldn't save your last answer. Check your connection and answer it again.");
      }
    });
  }

  // Picking or ticking an option: show it and save it straight away.
  function pickAnswer(questionId, answer) {
    setAnswers((current) => ({ ...current, [questionId]: answer }));
    queueSave(questionId, answer);
  }

  function toggleTick(questionId, optionIndex) {
    const ticked = answers[questionId] ?? [];
    pickAnswer(
      questionId,
      ticked.includes(optionIndex) ? ticked.filter((index) => index !== optionIndex) : [...ticked, optionIndex],
    );
  }

  // Short answers: show every key press, but only save once the student pauses.
  // typing.current holds, for each question being typed in, the text and its waiting timer.
  const typing = useRef({});

  function typeAnswer(questionId, text) {
    setAnswers((current) => ({ ...current, [questionId]: text }));
    clearTimeout(typing.current[questionId]?.timer);
    typing.current[questionId] = {
      text,
      timer: setTimeout(() => saveTyping(questionId), TYPING_PAUSE_MS),
    };
  }

  // Save a short answer now (if it's waiting), e.g. when the student leaves the box.
  function saveTyping(questionId) {
    const waiting = typing.current[questionId];
    if (!waiting) return;
    clearTimeout(waiting.timer);
    delete typing.current[questionId];
    queueSave(questionId, waiting.text);
  }

  function saveAllTyping() {
    Object.keys(typing.current).forEach(saveTyping);
  }

  async function handIn() {
    if (handedIn.current) return;
    handedIn.current = true; // from now on the blocker lets us leave
    if (blocker.state === "blocked") blocker.reset();
    saveAllTyping(); // send any short answer still waiting for a typing pause
    await saving.current; // let any answers still being saved finish first
    submit({}, { method: "post" });
  }

  // Hand in by ourselves when the timer reaches zero.
  useEffect(() => {
    if (timeUp) handIn();
  });

  const answeredCount = exam.questions.filter((question) => isAnswered(answers[question.id])).length;
  const unanswered = exam.questions.length - answeredCount;
  const locked = timeUp || isHandingIn;
  const total = exam.questions.length;
  const question = exam.questions[current];
  const isLast = current === total - 1;

  return (
    <div className="mx-auto max-w-2xl">
      <div className="rounded-2xl border border-gray-200 bg-surface p-6 shadow-lg">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-gray-500">
            {exam.title} · Question {current + 1} of {total}
          </span>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-semibold tabular-nums ${
              secondsLeft <= 60 ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-800"
            }`}
            aria-label="Time left"
          >
            <Timer aria-hidden="true" className="h-4 w-4" />
            {formatTime(secondsLeft)}
          </span>
        </div>
        {/* Fills up as questions are answered, not as the student moves between them. */}
        <div
          role="progressbar"
          aria-label="Questions answered"
          aria-valuemin={0}
          aria-valuemax={total}
          aria-valuenow={answeredCount}
          className="mt-3 h-1.5 rounded-full bg-gray-100"
        >
          <div
            className="h-1.5 rounded-full bg-indigo-600 transition-all"
            style={{ width: `${(answeredCount / total) * 100}%` }}
          />
        </div>

        {timeUp && (
          <p className="mt-5 flex items-center gap-2 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">
            <Hourglass aria-hidden="true" className="h-4 w-4 shrink-0" />
            Time's up! Handing in your answers...
          </p>
        )}

        {/* key: a fresh fieldset per question, so the radio buttons never mix between questions */}
        <fieldset key={question.id} disabled={locked} className="mt-5">
          <legend className="font-semibold">{question.text}</legend>
          <QuestionImage imageId={question.imageId} imageAlt={question.imageAlt} />
          <div className="mt-4 space-y-2 text-sm">
            {question.type === "multiple" && <p className="text-gray-500">Tick all that apply.</p>}
            {question.type === "short" ? (
              <input
                type="text"
                value={answers[question.id] ?? ""}
                onChange={(event) => typeAnswer(question.id, event.target.value)}
                onBlur={() => saveTyping(question.id)}
                maxLength={200}
                autoComplete="off"
                placeholder="Type your answer"
                aria-label="Your answer"
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600"
              />
            ) : (
              // option.index is the option's original number, sent when it's picked;
              // position is just where it appears for this student (A, B, C...).
              question.options.map((option, position) => {
                const isMultiple = question.type === "multiple";
                const isChosen = isMultiple
                  ? (answers[question.id] ?? []).includes(option.index)
                  : answers[question.id] === option.index;
                return (
                  <label
                    key={option.index}
                    className={`flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-2.5 has-focus-visible:ring-2 has-focus-visible:ring-indigo-600 ${
                      isChosen
                        ? "border-indigo-600 bg-indigo-50 font-medium text-indigo-700"
                        : "border-gray-200 text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <input
                      type={isMultiple ? "checkbox" : "radio"}
                      name={`answer-${question.id}`}
                      checked={isChosen}
                      onChange={() =>
                        isMultiple ? toggleTick(question.id, option.index) : pickAnswer(question.id, option.index)
                      }
                      className="sr-only"
                    />
                    {isMultiple ? (
                      <span
                        aria-hidden="true"
                        className={`flex h-4 w-4 items-center justify-center rounded border ${
                          isChosen ? "border-indigo-600 bg-indigo-600 text-white" : "border-gray-400"
                        }`}
                      >
                        {isChosen && <Check className="h-3 w-3" strokeWidth={3} />}
                      </span>
                    ) : (
                      question.type !== "truefalse" && (
                        <span className="w-4 text-gray-400">{OPTION_LETTERS[position]}</span>
                      )
                    )}
                    {option.text}
                  </label>
                );
              })
            )}
          </div>
        </fieldset>

        {(saveError || errors?.form) && (
          <p className="mt-5 flex items-center gap-2 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            <CircleAlert aria-hidden="true" className="h-4 w-4 shrink-0" />
            {saveError || errors.form}
          </p>
        )}

        <div className="mt-5 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setCurrent(current - 1)}
            disabled={current === 0}
            className="inline-flex items-center gap-1 rounded-md border border-gray-300 py-2 pr-4 pl-3 text-sm font-medium hover:bg-gray-100 disabled:invisible"
          >
            <ChevronLeft aria-hidden="true" className="h-4 w-4" />
            Previous
          </button>
          {isLast ? (
            <button
              type="button"
              onClick={() => setConfirmingHandIn(true)}
              disabled={locked}
              className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
            >
              {isHandingIn ? (
                <LoaderCircle aria-hidden="true" className="h-4 w-4 animate-spin" />
              ) : (
                <Send aria-hidden="true" className="h-4 w-4" />
              )}
              {isHandingIn ? "Handing in..." : "Hand in exam"}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setCurrent(current + 1)}
              className="inline-flex items-center gap-1 rounded-md bg-gray-900 py-2 pr-3 pl-4 text-sm font-medium text-gray-50 hover:bg-gray-700"
            >
              Next question
              <ChevronRight aria-hidden="true" className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Jump to any question; answered ones are filled in. */}
      <nav aria-label="Questions" className="mt-6">
        <p className="mb-2 text-sm text-gray-600">
          Answered {answeredCount} of {total}
        </p>
        <div className="flex flex-wrap gap-2">
          {exam.questions.map((item, index) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setCurrent(index)}
              aria-current={index === current ? "step" : undefined}
              className={`h-9 w-9 rounded-md text-sm font-medium ${
                index === current
                  ? "ring-2 ring-indigo-600 ring-offset-2 ring-offset-surface"
                  : ""
              } ${
                isAnswered(answers[item.id])
                  ? "bg-indigo-600 text-white"
                  : "border border-gray-300 bg-surface text-gray-700 hover:bg-gray-100"
              }`}
            >
              {index + 1}
            </button>
          ))}
        </div>
        {!isLast && (
          <button
            type="button"
            onClick={() => setConfirmingHandIn(true)}
            disabled={locked}
            className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:underline disabled:opacity-50"
          >
            <Send aria-hidden="true" className="h-4 w-4" />
            {isHandingIn ? "Handing in..." : "Hand in early"}
          </button>
        )}
      </nav>

      <ConfirmDialog
        open={blocker.state === "blocked" && !locked}
        title="Finish your exam first"
        confirmLabel="Hand in exam"
        cancelLabel="Back to exam"
        onCancel={() => blocker.reset()}
        onConfirm={() => handIn()}
      >
        <p>
          You can't leave this page until you hand in. You've answered{" "}
          <span className="font-semibold text-gray-900">
            {answeredCount} of {total}
          </span>{" "}
          questions, and the timer is still running.
        </p>
      </ConfirmDialog>

      <ConfirmDialog
        open={confirmingHandIn && !locked}
        title="Hand in your exam?"
        confirmLabel="Hand in"
        cancelLabel="Keep working"
        onCancel={() => setConfirmingHandIn(false)}
        onConfirm={() => {
          setConfirmingHandIn(false);
          handIn();
        }}
      >
        {unanswered > 0 ? (
          <p>
            You haven't answered{" "}
            <span className="font-semibold text-gray-900">
              {unanswered} {unanswered === 1 ? "question" : "questions"}
            </span>
            . You can't change your answers after handing in.
          </p>
        ) : (
          <p>You've answered every question. You can't change your answers after handing in.</p>
        )}
      </ConfirmDialog>
    </div>
  );
}
