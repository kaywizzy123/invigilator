import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { publishedExamSetup, signUp, startServer, startedMinutesAgo } from "./helpers.js";

const base = await startServer();

// The ids of the sample exam's questions, by their text.
function questionId(exam, text) {
  return exam.questions.find((question) => question.text === text).id;
}

describe("starting", () => {
  test("a student sees and starts a published exam set for their class", async () => {
    const { student, exam } = await publishedExamSetup(base);
    const list = (await student.get("/student/exams")).data.exams;
    assert.deepEqual(list.map((item) => item.id), [exam.id]);
    assert.equal((await student.post(`/student/exams/${exam.id}/start`)).status, 204);
  });

  test("students outside the exam's classes can't see or start it", async () => {
    const { exam } = await publishedExamSetup(base);
    const outsider = await signUp(base, { name: "Outsider" });
    assert.equal((await outsider.get("/student/exams")).data.exams.length, 0);
    assert.equal((await outsider.post(`/student/exams/${exam.id}/start`)).status, 404);
  });

  test("drafts are invisible to students", async () => {
    const { teacher, student, schoolClass } = await publishedExamSetup(base);
    const draft = (await teacher.post("/exams", { title: "Draft", timeLimitMinutes: 5, questions: [{ type: "truefalse", text: "x", answer: 0 }] })).data.exam;
    await teacher.put(`/exams/${draft.id}/classes`, { classIds: [schoolClass.id] });
    assert.equal((await student.post(`/student/exams/${draft.id}/start`)).status, 404);
  });

  test("starting twice keeps the same attempt and start time", async () => {
    const { student, exam } = await publishedExamSetup(base);
    await student.post(`/student/exams/${exam.id}/start`);
    const first = (await student.get(`/student/exams/${exam.id}/attempt`)).data.attempt.startedAt;
    await student.post(`/student/exams/${exam.id}/start`);
    const second = (await student.get(`/student/exams/${exam.id}/attempt`)).data.attempt.startedAt;
    assert.equal(first, second);
  });

  test("a closed exam can't be started, but someone already sitting it can carry on", async () => {
    const { teacher, student, schoolClass, exam } = await publishedExamSetup(base);
    const late = await signUp(base, { name: "Late" });
    await late.post("/student/classes/join", { code: schoolClass.code });
    await student.post(`/student/exams/${exam.id}/start`);
    await teacher.post(`/exams/${exam.id}/close`);
    assert.equal((await late.post(`/student/exams/${exam.id}/start`)).status, 403);
    assert.equal((await student.post(`/student/exams/${exam.id}/start`)).status, 204);
  });
});

describe("answering and marking", () => {
  test("the exam page never includes the correct answers", async () => {
    const { student, exam } = await publishedExamSetup(base);
    await student.post(`/student/exams/${exam.id}/start`);
    const page = (await student.get(`/student/exams/${exam.id}/attempt`)).data;
    assert.equal(JSON.stringify(page.exam).includes('"answer"'), false);
  });

  test("answers must fit the question, and are marked when handed in", async () => {
    const { student, exam } = await publishedExamSetup(base);
    const choice = questionId(exam, "What is 1 + 1?");
    const truth = questionId(exam, "The sky is blue.");
    await student.post(`/student/exams/${exam.id}/start`);
    const answer = (id, value) => student.put(`/student/exams/${exam.id}/answers`, { questionId: id, answer: value });

    assert.equal((await answer(choice, 7)).status, 400, "not an option");
    assert.equal((await answer(choice, "1")).status, 400, "text instead of a number");
    assert.equal((await answer("not-a-question", 0)).status, 400);
    assert.equal((await answer(choice, 0)).status, 204);
    assert.equal((await answer(choice, 1)).status, 204, "changing your mind is fine");
    assert.equal((await answer(truth, 1)).status, 204, "False: wrong");

    await student.post(`/student/exams/${exam.id}/submit`);
    const result = (await student.get(`/student/exams/${exam.id}/result`)).data.result;
    assert.equal(result.score, 1);
    assert.equal(result.total, 2);
    assert.equal((await answer(choice, 0)).status, 409, "no changes after handing in");
  });

  test("every question type is marked correctly, including all-or-nothing", async () => {
    const questions = [
      { type: "multiple", text: "Primes?", options: ["2", "4", "5"], answer: [0, 2] },
      { type: "short", text: "6 x 7?", answer: ["42", "forty-two"] },
    ];
    const { student, exam } = await publishedExamSetup(base, { questions });
    await student.post(`/student/exams/${exam.id}/start`);
    await student.put(`/student/exams/${exam.id}/answers`, { questionId: questionId(exam, "Primes?"), answer: [0] });
    await student.put(`/student/exams/${exam.id}/answers`, { questionId: questionId(exam, "6 x 7?"), answer: "  FORTY-TWO " });
    await student.post(`/student/exams/${exam.id}/submit`);
    const result = (await student.get(`/student/exams/${exam.id}/result`)).data.result;
    assert.deepEqual(
      result.questions.map((question) => [question.text, question.correct]).sort(),
      [["6 x 7?", true], ["Primes?", false]],
    );
  });

  test("no result (and so no answers) before handing in", async () => {
    const { student, exam } = await publishedExamSetup(base);
    await student.post(`/student/exams/${exam.id}/start`);
    assert.equal((await student.get(`/student/exams/${exam.id}/result`)).status, 404);
  });
});

describe("time", () => {
  test("after the time limit, answers are refused and the attempt is handed in with what was saved", async () => {
    const { student, exam } = await publishedExamSetup(base, { timeLimitMinutes: 5 });
    await student.post(`/student/exams/${exam.id}/start`);
    await student.put(`/student/exams/${exam.id}/answers`, { questionId: questionId(exam, "What is 1 + 1?"), answer: 1 });
    startedMinutesAgo(exam.id, 10);

    const late = await student.put(`/student/exams/${exam.id}/answers`, { questionId: questionId(exam, "The sky is blue."), answer: 0 });
    assert.equal(late.status, 409);
    const list = (await student.get("/student/exams")).data.exams;
    assert.ok(list[0].submittedAt, "handed in automatically");
    assert.equal(list[0].score, 1);
  });

  test("a scheduled exam can't be started before it opens", async () => {
    const { teacher, student, exam } = await publishedExamSetup(base);
    const opensAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    await teacher.put(`/exams/${exam.id}/schedule`, { opensAt, closesAt: null });
    const res = await student.post(`/student/exams/${exam.id}/start`);
    assert.equal(res.status, 403);
  });

  test("hard close: the closing time cuts a student's time short", async () => {
    const { teacher, student, exam } = await publishedExamSetup(base, { timeLimitMinutes: 30 });
    const closesAt = new Date(Date.now() + 2 * 60 * 1000).toISOString();
    await teacher.put(`/exams/${exam.id}/schedule`, { opensAt: null, closesAt });
    await student.post(`/student/exams/${exam.id}/start`);
    const { secondsLeft } = (await student.get(`/student/exams/${exam.id}/attempt`)).data.attempt;
    assert.ok(secondsLeft <= 120 && secondsLeft > 100, `expected about 2 minutes, got ${secondsLeft}s`);
  });
});
