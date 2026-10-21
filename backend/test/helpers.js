import { rm } from "node:fs/promises";
import { after } from "node:test";
import app from "../app.js";
import db from "../db.js";

// Starts the app on a free port for one test file, and stops it (and removes any
// uploaded test images) when the file's tests are done. Returns the API's base URL.
export async function startServer() {
  const server = app.listen(0); // 0 = any free port
  await new Promise((resolve) => server.once("listening", resolve));
  after(async () => {
    await new Promise((resolve) => server.close(resolve));
    await rm(process.env.UPLOADS_DIR, { recursive: true, force: true });
  });
  return `http://127.0.0.1:${server.address().port}/api`;
}

// A pretend browser: sends requests to the API and keeps its own login cookie,
// so each client is one person. Every call returns { status, data, headers }.
export function client(base) {
  let cookie = "";

  async function request(method, path, body, headers = {}) {
    const isFile = body instanceof Uint8Array;
    const res = await fetch(base + path, {
      method,
      headers: {
        ...(body !== undefined && !isFile ? { "Content-Type": "application/json" } : {}),
        ...(cookie ? { Cookie: cookie } : {}),
        ...headers,
      },
      body: body === undefined ? undefined : isFile ? body : JSON.stringify(body),
    });
    const setCookie = res.headers.get("set-cookie");
    if (setCookie) cookie = setCookie.split(";")[0];
    const text = await res.text();
    let data = text;
    try {
      data = JSON.parse(text);
    } catch {
      // not JSON (e.g. a CSV file or an image)
    }
    return { status: res.status, data, headers: res.headers };
  }

  return {
    get: (path) => request("GET", path),
    post: (path, body, headers) => request("POST", path, body, headers),
    put: (path, body) => request("PUT", path, body),
    delete: (path) => request("DELETE", path),
  };
}

// Each call makes a different email, so tests never clash.
let people = 0;
function uniqueEmail(name) {
  people += 1;
  return `${name.toLowerCase().replace(/\W+/g, "")}${people}@test.dev`;
}

// Signs up (and so logs in) a new teacher or student. Returns their client and details.
export async function signUp(base, { name = "Test Person", teacher = false, password = "secret1" } = {}) {
  const person = client(base);
  const email = uniqueEmail(name);
  const res = await person.post("/signup", {
    fullname: name,
    email,
    password,
    ...(teacher ? { teacherCode: process.env.TEACHER_CODE } : {}),
  });
  if (res.status !== 201) throw new Error(`Sign up failed: ${JSON.stringify(res.data)}`);
  return { ...person, user: res.data.user, email, password };
}

// A small valid exam: one multiple choice question (answer: option 1) and one true/false (answer: True).
export const sampleQuestions = [
  { type: "single", text: "What is 1 + 1?", options: ["1", "2", "3"], answer: 1 },
  { type: "truefalse", text: "The sky is blue.", answer: 0 },
];

// A teacher with a class, a published exam set for it, and a student in that class.
export async function publishedExamSetup(base, { timeLimitMinutes = 10, questions = sampleQuestions } = {}) {
  const teacher = await signUp(base, { name: "Teacher", teacher: true });
  const student = await signUp(base, { name: "Student" });
  const schoolClass = (await teacher.post("/classes", { name: "9A" })).data.class;
  await student.post("/student/classes/join", { code: schoolClass.code });
  const exam = (await teacher.post("/exams", { title: "Quiz", timeLimitMinutes, questions })).data.exam;
  await teacher.put(`/exams/${exam.id}/classes`, { classIds: [schoolClass.id] });
  await teacher.post(`/exams/${exam.id}/publish`);
  const full = (await teacher.get(`/exams/${exam.id}`)).data.exam; // with question ids and answers
  return { teacher, student, schoolClass, exam: full };
}

// Moves an attempt's start time into the past, to test what happens when time runs out.
export function startedMinutesAgo(examId, minutes) {
  db.prepare("UPDATE attempts SET started_at = ? WHERE exam_id = ?").run(
    new Date(Date.now() - minutes * 60 * 1000).toISOString(),
    examId,
  );
}
