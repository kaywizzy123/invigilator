import assert from "node:assert/strict";
import { test } from "node:test";
import { publishedExamSetup, signUp, startServer } from "./helpers.js";

const base = await startServer();

// Hands in the exam with the multiple choice question right and the true/false one wrong.
async function sitHalfRight(student, exam) {
  const id = (text) => exam.questions.find((question) => question.text === text).id;
  await student.post(`/student/exams/${exam.id}/start`);
  await student.put(`/student/exams/${exam.id}/answers`, { questionId: id("What is 1 + 1?"), answer: 1 });
  await student.put(`/student/exams/${exam.id}/answers`, { questionId: id("The sky is blue."), answer: 1 });
  await student.post(`/student/exams/${exam.id}/submit`);
}

test("the teacher sees each student's score and which questions they got right", async () => {
  const { teacher, student, exam } = await publishedExamSetup(base);
  await sitHalfRight(student, exam);
  const { results } = (await teacher.get(`/exams/${exam.id}/results`)).data;
  assert.equal(results.students.length, 1);
  assert.equal(results.students[0].score, 1);
  assert.equal(results.students[0].correctQuestionIds.length, 1);
  assert.equal(results.students[0].classes[0].name, "9A");
});

test("other teachers and students can't see the results", async () => {
  const { student, exam } = await publishedExamSetup(base);
  const other = await signUp(base, { name: "Other", teacher: true });
  assert.equal((await other.get(`/exams/${exam.id}/results`)).status, 404);
  assert.equal((await student.get(`/exams/${exam.id}/results`)).status, 403);
});

test("the CSV is safe to open in a spreadsheet", async () => {
  const { teacher, schoolClass, exam } = await publishedExamSetup(base);
  const tricky = await signUp(base, { name: '=HYPERLINK("http://evil")' });
  const comma = await signUp(base, { name: 'Adé, "BJ" Ọlá' });
  for (const student of [tricky, comma]) {
    await student.post("/student/classes/join", { code: schoolClass.code });
    await sitHalfRight(student, exam);
  }
  const res = await teacher.get(`/exams/${exam.id}/results.csv`);
  assert.equal(res.headers.get("content-type"), "text/csv; charset=utf-8");
  assert.match(res.headers.get("content-disposition"), /attachment; filename="quiz-results\.csv"/);
  const csv = res.data;
  assert.ok(csv.startsWith("﻿"), "starts with the byte order mark Excel needs");
  assert.ok(csv.includes(`"'=HYPERLINK(""http://evil"")"`), "the formula is turned into plain text");
  assert.ok(csv.includes('"Adé, ""BJ"" Ọlá"'), "commas and quotes are kept inside one cell");
});

test("a student's progress lists their handed-in exams; a teacher sees only their own exams", async () => {
  const first = await publishedExamSetup(base);
  await sitHalfRight(first.student, first.exam);

  // A second teacher's exam, sat by the same student.
  const second = await publishedExamSetup(base);
  await first.student.post("/student/classes/join", { code: second.schoolClass.code });
  await sitHalfRight(first.student, second.exam);

  const own = (await first.student.get("/student/progress")).data.progress.exams;
  assert.equal(own.length, 2);

  const asFirstTeacher = await first.teacher.get(`/classes/${first.schoolClass.id}/students/${first.student.user.id}/progress`);
  assert.equal(asFirstTeacher.data.progress.exams.length, 1);
  assert.equal(asFirstTeacher.data.progress.exams[0].examId, first.exam.id);
});
