import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { detectImageType } from "../images.js";
import { signUp, startServer, tinyPng } from "./helpers.js";

describe("detectImageType", () => {
  test("recognises real images by their first bytes", () => {
    assert.equal(detectImageType(Buffer.from(tinyPng)).mime, "image/png");
    const jpeg = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(20)]);
    assert.equal(detectImageType(jpeg).mime, "image/jpeg");
    assert.equal(detectImageType(Buffer.from("GIF89a" + "x".repeat(10))).mime, "image/gif");
  });

  test("refuses text, SVG and empty files, whatever they're called", () => {
    assert.equal(detectImageType(Buffer.from("just some text, not a picture")), null);
    assert.equal(detectImageType(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>x</script></svg>')), null);
    assert.equal(detectImageType(Buffer.alloc(0)), null);
  });
});

describe("image uploads", async () => {
  const base = await startServer();
  const teacher = await signUp(base, { name: "Teacher", teacher: true });
  const otherTeacher = await signUp(base, { name: "Other", teacher: true });
  const student = await signUp(base, { name: "Student" });

  test("a teacher can upload an image, and logged-in users can view it", async () => {
    const upload = await teacher.post("/images", tinyPng, { "Content-Type": "image/png" });
    assert.equal(upload.status, 201);

    const res = await student.get(`/images/${upload.data.imageId}`);
    assert.equal(res.status, 200);
    assert.equal(res.headers.get("content-type"), "image/png");
    assert.equal(res.headers.get("x-content-type-options"), "nosniff");
    assert.equal(Number(res.headers.get("content-length")), tinyPng.length, "the whole image came back");
  });

  test("refuses files that aren't images, and SVGs", async () => {
    const text = await teacher.post("/images", new TextEncoder().encode("not an image"), { "Content-Type": "image/png" });
    assert.equal(text.status, 400);
    const svg = await teacher.post("/images", new TextEncoder().encode("<svg></svg>"), { "Content-Type": "image/svg+xml" });
    assert.equal(svg.status, 400);
  });

  test("refuses images over 2 MB", async () => {
    const big = new Uint8Array(3 * 1024 * 1024);
    big.set(tinyPng);
    const res = await teacher.post("/images", big, { "Content-Type": "image/png" });
    assert.equal(res.status, 413);
  });

  test("students can't upload", async () => {
    const res = await student.post("/images", tinyPng, { "Content-Type": "image/png" });
    assert.equal(res.status, 403);
  });

  test("images can't be viewed when logged out", async () => {
    const upload = await teacher.post("/images", tinyPng, { "Content-Type": "image/png" });
    const res = await fetch(`${base}/images/${upload.data.imageId}`);
    assert.equal(res.status, 401);
  });

  test("a question can only use an image its own teacher uploaded", async () => {
    const theirs = (await otherTeacher.post("/images", tinyPng, { "Content-Type": "image/png" })).data.imageId;
    const mine = (await teacher.post("/images", tinyPng, { "Content-Type": "image/png" })).data.imageId;
    const question = (imageId) => ({ type: "truefalse", text: "Look", answer: 0, imageId, imageAlt: "A dot" });

    const refused = await teacher.post("/exams", { title: "X", timeLimitMinutes: 5, questions: [question(theirs)] });
    assert.equal(refused.status, 400);

    const saved = await teacher.post("/exams", { title: "X", timeLimitMinutes: 5, questions: [question(mine)] });
    assert.equal(saved.status, 201);
    const exam = (await teacher.get(`/exams/${saved.data.exam.id}`)).data.exam;
    assert.equal(exam.questions[0].imageId, mine);
    assert.equal(exam.questions[0].imageAlt, "A dot");
  });
});
