import assert from "node:assert/strict";
import { test } from "node:test";
import { client, publishedExamSetup, signUp, startServer } from "./helpers.js";

const base = await startServer();

test("students join with a code, forgiving lowercase and spaces", async () => {
  const teacher = await signUp(base, { name: "Teacher", teacher: true });
  const student = await signUp(base, { name: "Student" });
  const schoolClass = (await teacher.post("/classes", { name: "9A" })).data.class;
  assert.match(schoolClass.code, /^[A-HJ-NP-Z2-9]{6}$/, "6 characters, no easily-confused ones");

  const typed = ` ${schoolClass.code.slice(0, 3).toLowerCase()} ${schoolClass.code.slice(3).toLowerCase()} `;
  assert.equal((await student.post("/student/classes/join", { code: typed })).status, 200);
  assert.equal((await student.post("/student/classes/join", { code: "ZZZZZZ" })).status, 404);
  assert.deepEqual((await student.get("/student/classes")).data.classes.map((item) => item.name), ["9A"]);
});

test("only the class's teacher can see or change it", async () => {
  const teacher = await signUp(base, { name: "Owner", teacher: true });
  const other = await signUp(base, { name: "Other", teacher: true });
  const schoolClass = (await teacher.post("/classes", { name: "Mine" })).data.class;
  assert.equal((await other.get(`/classes/${schoolClass.id}`)).status, 404);
  assert.equal((await other.delete(`/classes/${schoolClass.id}`)).status, 404);
});

test("removing a student or deleting the class keeps their results", async () => {
  const { teacher, student, schoolClass, exam } = await publishedExamSetup(base);
  await student.post(`/student/exams/${exam.id}/start`);
  await student.post(`/student/exams/${exam.id}/submit`);

  await teacher.delete(`/classes/${schoolClass.id}/students/${student.user.id}`);
  assert.equal((await student.get("/student/classes")).data.classes.length, 0);
  assert.equal((await student.get(`/student/exams/${exam.id}/result`)).status, 200, "still has their result");

  await teacher.delete(`/classes/${schoolClass.id}`);
  assert.equal((await teacher.get(`/classes/${schoolClass.id}`)).status, 404);
  assert.equal((await teacher.get(`/exams/${exam.id}/results`)).data.results.students.length, 1);
});

test("a teacher reset gives a temporary password that must be replaced before anything else", async () => {
  const { teacher, student, schoolClass } = await publishedExamSetup(base);
  const reset = await teacher.post(`/classes/${schoolClass.id}/students/${student.user.id}/reset-password`);
  assert.equal(reset.status, 200);
  const temporary = reset.data.temporaryPassword;
  assert.match(temporary, /^[A-Z2-9]{4}-[A-Z2-9]{4}$/);

  assert.equal((await student.get("/me")).status, 401, "logged out everywhere");
  assert.equal((await client(base).post("/login", { email: student.email, password: student.password })).status, 401);

  const browser = client(base);
  const login = await browser.post("/login", { email: student.email, password: temporary });
  assert.equal(login.data.user.mustChangePassword, true);
  assert.equal((await browser.get("/student/exams")).status, 403, "nothing else works yet");

  assert.equal((await browser.put("/me/new-password", { newPassword: "mine123" })).status, 200);
  assert.equal((await browser.get("/student/exams")).status, 200);
  assert.equal((await client(base).post("/login", { email: student.email, password: temporary })).status, 401);
});

test("teachers can only reset students in their own classes", async () => {
  const { student, schoolClass } = await publishedExamSetup(base);
  const otherTeacher = await signUp(base, { name: "Other", teacher: true });
  const res = await otherTeacher.post(`/classes/${schoolClass.id}/students/${student.user.id}/reset-password`);
  assert.equal(res.status, 404);
});
