import { useState } from "react";
import { ChartLine, ChevronRight, ClipboardList, Medal, Minus, Sigma, TrendingDown, TrendingUp } from "lucide-react";
import { Link } from "react-router";
import EmptyState from "./EmptyState";

function percentOf(score, total) {
  return total > 0 ? Math.round((score / total) * 100) : 0;
}

function shortDate(iso) {
  return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

// A summary number with a label, e.g. "Average 72%".
function StatTile({ icon: Icon, label, value, detail }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-surface p-4">
      <p className="flex items-center gap-1.5 text-sm text-gray-500">
        <Icon aria-hidden="true" className="h-4 w-4" />
        {label}
      </p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
      {detail && <p className="mt-0.5 text-xs text-gray-500">{detail}</p>}
    </div>
  );
}

const GRID_LINES = [0, 25, 50, 75, 100];

// A line chart of percentages, one dot per exam, oldest on the left.
// The dots are buttons, so hovering or tabbing to one shows its exam in a tooltip.
function ScoreChart({ points }) {
  // Which dot is being hovered or focused, or null.
  const [active, setActive] = useState(null);
  const latest = points[points.length - 1];

  // Keep a label from hanging off the left or right edge: centre it, unless the dot is at an edge.
  function alignAt(x) {
    if (x === 0) return "translate-x-0";
    if (x === 100) return "-translate-x-full";
    return "-translate-x-1/2";
  }

  return (
    <figure className="rounded-xl border border-gray-200 bg-surface p-6">
      <figcaption className="flex items-center gap-2 font-semibold">
        <ChartLine aria-hidden="true" className="h-5 w-5 text-gray-500" />
        Score over time
      </figcaption>

      <div className="mt-4 flex pt-8">
        {/* The y-axis: 0% to 100% */}
        <div className="relative h-48 w-10 shrink-0 text-xs text-gray-500 tabular-nums" aria-hidden="true">
          {GRID_LINES.map((value) => (
            <span key={value} className="absolute right-2 translate-y-1/2" style={{ bottom: `${value}%` }}>
              {value}%
            </span>
          ))}
        </div>

        <div className="relative mx-3 h-48 flex-1">
          {GRID_LINES.map((value) => (
            <div key={value} className="absolute inset-x-0 border-t border-gray-100" style={{ bottom: `${value}%` }} />
          ))}

          {/* The line. viewBox 0–100 both ways, stretched to fit; non-scaling-stroke keeps it 2px wide. */}
          <svg
            className="absolute inset-0 h-full w-full overflow-visible"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <polyline
              points={points.map((point) => `${point.x},${100 - point.percent}`).join(" ")}
              fill="none"
              className="stroke-indigo-600"
              strokeWidth="2"
              strokeLinejoin="round"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
          </svg>

          {points.map((point, index) => (
            <button
              key={point.attemptId}
              type="button"
              onPointerEnter={() => setActive(index)}
              onPointerLeave={() => setActive(null)}
              onFocus={() => setActive(index)}
              onBlur={() => setActive(null)}
              aria-label={`${point.title}: ${point.percent}%, ${shortDate(point.submittedAt)}`}
              // The button is the hit area (28px), bigger than the 10px dot inside it.
              className="absolute h-7 w-7 -translate-x-1/2 translate-y-1/2 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
              style={{ left: `${point.x}%`, bottom: `${point.percent}%` }}
            >
              <span className="absolute top-1/2 left-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-600 ring-2 ring-surface" />
            </button>
          ))}

          {/* Only the latest score gets a label; the tooltip and the list carry the rest. */}
          {active === null && (
            <span
              className={`pointer-events-none absolute pb-3 text-sm font-semibold text-gray-900 ${alignAt(latest.x)}`}
              style={{ left: `${latest.x}%`, bottom: `${latest.percent}%` }}
            >
              {latest.percent}%
            </span>
          )}

          {active !== null && (
            <div
              role="status"
              className={`pointer-events-none absolute z-10 mb-4 rounded-md border border-gray-200 bg-surface px-3 py-2 text-xs whitespace-nowrap shadow-lg ${alignAt(points[active].x)}`}
              style={{ left: `${points[active].x}%`, bottom: `${points[active].percent}%` }}
            >
              <p className="text-sm font-semibold text-gray-900">
                {points[active].percent}%{" "}
                <span className="font-normal text-gray-500">
                  ({points[active].score}/{points[active].total})
                </span>
              </p>
              <p className="text-gray-700">{points[active].title}</p>
              <p className="text-gray-500">{shortDate(points[active].submittedAt)}</p>
            </div>
          )}
        </div>
      </div>

      {/* The x-axis: just the first and last dates, so labels never crowd. */}
      <div className="mt-2 ml-13 mr-3 flex justify-between text-xs text-gray-500" aria-hidden="true">
        <span>{shortDate(points[0].submittedAt)}</span>
        <span>{shortDate(latest.submittedAt)}</span>
      </div>
    </figure>
  );
}

// A student's results across exams: summary figures, a chart, and the list.
// exams: oldest first, each { attemptId, examId, title, teacherName, submittedAt, score, total }.
// linkTo(exam): where clicking an exam goes. showTeacher: add a "set by" column.
export default function ProgressView({ exams, linkTo, showTeacher }) {
  if (exams.length === 0) {
    return (
      <EmptyState icon={ClipboardList} title="No exams handed in yet">
        Scores will appear here after each exam is handed in.
      </EmptyState>
    );
  }

  const points = exams.map((exam, index) => ({
    ...exam,
    percent: percentOf(exam.score, exam.total),
    // Spread the dots evenly from left (0) to right (100). One exam sits in the middle.
    x: exams.length === 1 ? 50 : (index / (exams.length - 1)) * 100,
  }));
  const percents = points.map((point) => point.percent);
  const average = Math.round(percents.reduce((sum, percent) => sum + percent, 0) / percents.length);
  const best = points.reduce((top, point) => (point.percent > top.percent ? point : top));
  const latest = points[points.length - 1];
  const previous = points[points.length - 2];
  const change = previous ? latest.percent - previous.percent : null;
  const ChangeIcon = change > 0 ? TrendingUp : change < 0 ? TrendingDown : Minus;

  return (
    <div className="flex flex-col gap-6">
      <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatTile icon={ClipboardList} label="Exams taken" value={exams.length} />
        <StatTile icon={Sigma} label="Average" value={`${average}%`} />
        <StatTile icon={Medal} label="Best" value={`${best.percent}%`} detail={best.title} />
        <StatTile
          icon={ChangeIcon}
          label="Latest"
          value={`${latest.percent}%`}
          detail={
            change === null
              ? latest.title
              : `${change > 0 ? "+" : ""}${change} points on the exam before`
          }
        />
      </section>

      {points.length >= 2 && <ScoreChart points={points} />}

      <section>
        <h2 className="mb-3 flex items-center gap-2 font-semibold">
          <ClipboardList aria-hidden="true" className="h-5 w-5 text-gray-500" />
          Exams
        </h2>
        <ul className="divide-y divide-gray-200 rounded-xl border border-gray-200 bg-surface">
          {[...points].reverse().map((point) => (
            <li key={point.attemptId}>
              <Link
                to={linkTo(point)}
                className="flex items-center justify-between gap-4 px-6 py-3 hover:bg-gray-50"
              >
                <div>
                  <p className="font-medium">{point.title}</p>
                  <p className="text-sm text-gray-500">
                    {shortDate(point.submittedAt)}
                    {showTeacher && ` · ${point.teacherName}`}
                  </p>
                </div>
                <div className="flex items-center gap-3 tabular-nums">
                  <span className="text-sm text-gray-500">
                    {point.score}/{point.total}
                  </span>
                  <span className="w-12 text-right font-semibold">{point.percent}%</span>
                  <ChevronRight aria-hidden="true" className="h-4 w-4 text-gray-400" />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
