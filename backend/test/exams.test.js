import assert from "node:assert/strict";
import { test } from "node:test";
import { publishedExamSetup, sampleQuestions, signUp, startServer } from "./helpers.js";

const base = await startServer();
const teacher = await signUp(base, { name: "Teacher", teacher: true });
const otherTeacher = await signUp(base, { name: "Other", teacher: true });
const student = await signUp(base, { name: "Student" });

function newExam(by = teacher, changes = {}) {
  return by.post("/exams", { title: "Quiz", timeLimitMinutes: 10, questions: sampleQuestions, ...changes });
}

test("a teacher creates an exam; it starts as a draft", async () => {
  const res = await newExam();
  assert.equal(res.status, 201);
  assert.equal(res.data.exam.publishedAt, null);
  const list = (await teacher.get("/exams")).data.exams;
  assert.ok(list.some((exam) => exam.id === res.data.exam.id));
});

test("every question type is checked before saving", async () => {
  const bad = [
    [{ type: "essay", text: "x" }, "unknown type"],
    [{ type: "single", text: "x", options: ["only one"], answer: 0 }, "fewer than 2 options"],
    [{ type: "single", text: "x", options: ["a", "b", "c", "d", "e", "f", "g"], answer: 0 }, "more than 6 options"],
    [{ type: "single", text: "x", options: ["a", ""], answer: 0 }, "an empty option"],
    [{ type: "single", text: "x", options: ["a", "b"], answer: 5 }, "an answer that isn't an option"],
    [{ type: "multiple", text: "x", options: ["a", "b"], answer: [] }, "nothing ticked"],
    [{ type: "truefalse", text: "x" }, "no True/False picked"],
    [{ type: "short", text: "x", answer: ["  "] }, "no accepted answer"],
    [{ type: "single", text: "", options: ["a", "b"], answer: 0 }, "no question text"],
  ];
  for (const [question, why] of bad) {
    const res = await newExam(teacher, { questions: [question] });
    assert.equal(res.status, 400, why);
  }
  assert.equal((await newExam(teacher, { title: "" })).status, 400, "no title");
  assert.equal((await newExam(teacher, { timeLimitMinutes: 0 })).status, 400, "no time");
  assert.equal((await newExam(teacher, { questions: [] })).status, 400, "no questions");
});

test("students can't create exams", async () => {
  assert.equal((await newExam(student)).status, 403);
});

test("other teachers can't see, edit, publish or delete your exam", async () => {
  const exam = (await newExam()).data.exam;
  assert.equal((await otherTeacher.get(`/exams/${exam.id}`)).status, 404);
  assert.equal((await otherTeacher.put(`/exams/${exam.id}`, { title: "Mine", timeLimitMinutes: 5, questions: sampleQuestions })).status, 404);
  assert.equal((await otherTeacher.post(`/exams/${exam.id}/publish`)).status, 404);
  assert.equal((await otherTeacher.delete(`/exams/${exam.id}`)).status, 404);
});

test("publishing needs at least one class", async () => {
  const exam = (await newExam()).data.exam;
  assert.equal((await teacher.post(`/exams/${exam.id}/publish`)).status, 409);
  const schoolClass = (await teacher.post("/classes", { name: "9A" })).data.class;
  await teacher.put(`/exams/${exam.id}/classes`, { classIds: [schoolClass.id] });
  assert.equal((await teacher.post(`/exams/${exam.id}/publish`)).status, 200);
  assert.equal(
    (await teacher.put(`/exams/${exam.id}/classes`, { classIds: [] })).status,
    409,
    "a published exam can't be left with no class",
  );
});

test("a teacher can only set an exam for their own classes", async () => {
  const exam = (await newExam()).data.exam;
  const theirClass = (await otherTeacher.post("/classes", { name: "Theirs" })).data.class;
  assert.equal((await teacher.put(`/exams/${exam.id}/classes`, { classIds: [theirClass.id] })).status, 400);
});

test("once a student starts, the exam is locked: no edits or deletes, but it can be duplicated", async () => {
  const { teacher: owner, student: sitter, exam } = await publishedExamSetup(base);
  await sitter.post(`/student/exams/${exam.id}/start`);

  const edit = await owner.put(`/exams/${exam.id}`, { title: "Changed", timeLimitMinutes: 5, questions: sampleQuestions });
  assert.equal(edit.status, 409);
  assert.equal((await owner.delete(`/exams/${exam.id}`)).status, 409);

  const copy = await owner.post(`/exams/${exam.id}/duplicate`);
  assert.equal(copy.status, 201);
  assert.equal(copy.data.exam.title, "Copy of Quiz");
  assert.equal(copy.data.exam.publishedAt, null, "the copy is a draft");
  assert.equal((await owner.put(`/exams/${copy.data.exam.id}`, { title: "Fixed", timeLimitMinutes: 5, questions: sampleQuestions })).status, 200);
});

test("a draft can be edited and deleted", async () => {
  const exam = (await newExam()).data.exam;
  const edit = await teacher.put(`/exams/${exam.id}`, { title: "Renamed", timeLimitMinutes: 20, questions: sampleQuestions });
  assert.equal(edit.data.exam.title, "Renamed");
  assert.equal((await teacher.delete(`/exams/${exam.id}`)).status, 204);
  assert.equal((await teacher.get(`/exams/${exam.id}`)).status, 404);
});

test("schedules must close after they open, and use real dates", async () => {
  const exam = (await newExam()).data.exam;
  const later = new Date(Date.now() + 60 * 60 * 1000).toISOString();
  const sooner = new Date(Date.now() + 30 * 60 * 1000).toISOString();
  assert.equal((await teacher.put(`/exams/${exam.id}/schedule`, { opensAt: later, closesAt: sooner })).status, 400);
  assert.equal((await teacher.put(`/exams/${exam.id}/schedule`, { opensAt: "next tuesday", closesAt: null })).status, 400);
  assert.equal((await teacher.put(`/exams/${exam.id}/schedule`, { opensAt: sooner, closesAt: later })).status, 200);
});
