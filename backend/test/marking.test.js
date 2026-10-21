import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { deadlineFor, isCorrect } from "../marking.js";

describe("isCorrect", () => {
  test("multiple choice: right only for the correct option", () => {
    const question = { type: "single", options: ["a", "b", "c"], answer: 1 };
    assert.equal(isCorrect(question, 1), true);
    assert.equal(isCorrect(question, 0), false);
    assert.equal(isCorrect(question, undefined), false);
  });

  test("multiple answers: all or nothing, in any order", () => {
    const question = { type: "multiple", options: ["a", "b", "c", "d"], answer: [0, 2] };
    assert.equal(isCorrect(question, [0, 2]), true);
    assert.equal(isCorrect(question, [2, 0]), true);
    assert.equal(isCorrect(question, [0]), false, "missing one");
    assert.equal(isCorrect(question, [0, 1, 2]), false, "one too many");
    assert.equal(isCorrect(question, []), false);
  });

  test("short answer: any accepted answer, ignoring capitals and extra spaces", () => {
    const question = { type: "short", options: [], answer: ["42", "forty-two"] };
    assert.equal(isCorrect(question, "42"), true);
    assert.equal(isCorrect(question, "  FORTY-TWO "), true);
    assert.equal(isCorrect(question, "forty  two"), false);
    assert.equal(isCorrect(question, "4 2"), false);
  });

  test("true/false", () => {
    const question = { type: "truefalse", options: ["True", "False"], answer: 1 };
    assert.equal(isCorrect(question, 1), true);
    assert.equal(isCorrect(question, 0), false);
  });
});

describe("deadlineFor", () => {
  const startedAt = "2026-10-20T09:00:00.000Z";

  test("is the start time plus the time limit", () => {
    const deadline = deadlineFor({ startedAt }, { timeLimitMinutes: 30 });
    assert.equal(deadline.toISOString(), "2026-10-20T09:30:00.000Z");
  });

  test("is the closing time instead, if that comes first (hard close)", () => {
    const deadline = deadlineFor({ startedAt }, { timeLimitMinutes: 30, closesAt: "2026-10-20T09:10:00.000Z" });
    assert.equal(deadline.toISOString(), "2026-10-20T09:10:00.000Z");
  });

  test("ignores a closing time after the time limit ends", () => {
    const deadline = deadlineFor({ startedAt }, { timeLimitMinutes: 30, closesAt: "2026-10-20T12:00:00.000Z" });
    assert.equal(deadline.toISOString(), "2026-10-20T09:30:00.000Z");
  });
});
