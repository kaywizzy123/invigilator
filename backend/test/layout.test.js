import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { inStudentOrder, randomLayout } from "../layout.js";

const exam = {
  questions: [
    { id: "q1", type: "single", text: "One", options: ["a", "b", "c", "d"], answer: 0 },
    { id: "q2", type: "multiple", text: "Two", options: ["a", "b", "c"], answer: [0, 2] },
    { id: "q3", type: "truefalse", text: "Three", options: ["True", "False"], answer: 1 },
    { id: "q4", type: "short", text: "Four", options: [], answer: ["x"] },
  ],
};

describe("randomLayout", () => {
  test("includes every question exactly once", () => {
    const layout = randomLayout(exam);
    assert.deepEqual([...layout.questions].sort(), ["q1", "q2", "q3", "q4"]);
  });

  test("shuffles each question's options without losing or repeating any", () => {
    const layout = randomLayout(exam);
    assert.deepEqual([...layout.options.q1].sort(), [0, 1, 2, 3]);
    assert.deepEqual([...layout.options.q2].sort(), [0, 1, 2]);
  });

  test("keeps True before False", () => {
    for (let i = 0; i < 20; i++) {
      assert.deepEqual(randomLayout(exam).options.q3, [0, 1]);
    }
  });

  test("really shuffles (orders differ across many students)", () => {
    const orders = new Set();
    for (let i = 0; i < 50; i++) orders.add(randomLayout(exam).questions.join());
    assert.ok(orders.size > 1, "50 students all got the same order");
  });
});

describe("inStudentOrder", () => {
  test("puts questions and options in the student's order, keeping each option's original number", () => {
    const layout = { questions: ["q2", "q1", "q3", "q4"], options: { q1: [3, 2, 1, 0], q2: [2, 0, 1], q3: [0, 1], q4: [] } };
    const questions = inStudentOrder(exam, layout);
    assert.deepEqual(questions.map((question) => question.id), ["q2", "q1", "q3", "q4"]);
    assert.deepEqual(questions[1].options, [
      { index: 3, text: "d" },
      { index: 2, text: "c" },
      { index: 1, text: "b" },
      { index: 0, text: "a" },
    ]);
  });

  test("uses the original order when there's no saved layout", () => {
    const questions = inStudentOrder(exam, null);
    assert.deepEqual(questions.map((question) => question.id), ["q1", "q2", "q3", "q4"]);
    assert.deepEqual(questions[0].options.map((option) => option.index), [0, 1, 2, 3]);
  });
});
