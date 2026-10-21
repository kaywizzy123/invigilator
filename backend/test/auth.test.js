import assert from "node:assert/strict";
import { test } from "node:test";
import { client, signUp, startServer } from "./helpers.js";

const base = await startServer();

test("sign up makes a student, unless the teacher code is given", async () => {
  const student = await signUp(base, { name: "Stu" });
  const teacher = await signUp(base, { name: "Tea", teacher: true });
  assert.equal(student.user.role, "student");
  assert.equal(teacher.user.role, "teacher");
});

test("a wrong teacher code is refused rather than quietly making a student", async () => {
  const res = await client(base).post("/signup", {
    fullname: "Sneaky",
    email: "sneaky@test.dev",
    password: "secret1",
    teacherCode: "guess",
  });
  assert.equal(res.status, 403);
});

test("an email can only be used once", async () => {
  const first = await signUp(base, { name: "Once" });
  const res = await client(base).post("/signup", { fullname: "Again", email: first.email, password: "secret1" });
  assert.equal(res.status, 409);
});

test("passwords are never sent back", async () => {
  const person = await signUp(base, { name: "Private" });
  const me = await person.get("/me");
  assert.equal(JSON.stringify(me.data).includes("password"), false);
});

test("log in, see who you are, log out", async () => {
  const person = await signUp(base, { name: "Ada" });
  const browser = client(base);
  assert.equal((await browser.get("/me")).status, 401);

  const wrong = await browser.post("/login", { email: person.email, password: "nope" });
  assert.equal(wrong.status, 401);

  const login = await browser.post("/login", { email: person.email.toUpperCase(), password: person.password });
  assert.equal(login.status, 200, "emails ignore capitals");
  assert.equal((await browser.get("/me")).data.user.fullname, "Ada");

  await browser.post("/logout");
  assert.equal((await browser.get("/me")).status, 401);
});

test("profile: change name and email, but not to someone else's email, and never the role", async () => {
  const ada = await signUp(base, { name: "Ada" });
  const bola = await signUp(base, { name: "Bola" });

  const taken = await ada.put("/me", { fullname: "Ada", email: bola.email });
  assert.equal(taken.status, 409);

  const ok = await ada.put("/me", { fullname: "Ada Lovelace", email: "ada.new@test.dev", role: "teacher" });
  assert.equal(ok.status, 200);
  assert.equal(ok.data.user.fullname, "Ada Lovelace");
  assert.equal(ok.data.user.role, "student", "a sneaky role field is ignored");
});

test("changing password needs the current one, and logs out other devices", async () => {
  const person = await signUp(base, { name: "Changer" });
  const otherDevice = client(base);
  await otherDevice.post("/login", { email: person.email, password: person.password });

  const wrong = await person.put("/me/password", { currentPassword: "nope", newPassword: "newpass1" });
  assert.equal(wrong.status, 403);

  const ok = await person.put("/me/password", { currentPassword: person.password, newPassword: "newpass1" });
  assert.equal(ok.status, 204);
  assert.equal((await person.get("/me")).status, 200, "this device stays logged in");
  assert.equal((await otherDevice.get("/me")).status, 401, "the other device is logged out");

  const relogin = await client(base).post("/login", { email: person.email, password: "newpass1" });
  assert.equal(relogin.status, 200);
});

test("a teacher can reset their own password with the teacher code", async () => {
  const teacher = await signUp(base, { name: "Forgetful", teacher: true });
  const student = await signUp(base, { name: "Student" });

  const wrongCode = await client(base).post("/teacher-reset", { email: teacher.email, teacherCode: "nope", newPassword: "newpass1" });
  const studentEmail = await client(base).post("/teacher-reset", {
    email: student.email,
    teacherCode: process.env.TEACHER_CODE,
    newPassword: "newpass1",
  });
  assert.equal(wrongCode.status, 403);
  assert.equal(studentEmail.status, 403);
  assert.equal(wrongCode.data.error, studentEmail.data.error, "same message, so it doesn't reveal who has an account");

  const browser = client(base);
  const ok = await browser.post("/teacher-reset", { email: teacher.email, teacherCode: process.env.TEACHER_CODE, newPassword: "newpass1" });
  assert.equal(ok.status, 200);
  assert.equal((await browser.get("/me")).data.user.email, teacher.email, "logged straight in");
  assert.equal((await teacher.get("/me")).status, 401, "old sessions logged out");
});
