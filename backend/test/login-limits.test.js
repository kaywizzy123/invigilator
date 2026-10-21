import assert from "node:assert/strict";
import { test } from "node:test";
import db from "../db.js";
import { client, signUp, startServer } from "./helpers.js";

const base = await startServer();

function wrongPasswords(email, times) {
  return Promise.all(Array.from({ length: times }, () => client(base).post("/login", { email, password: "wrong" })));
}

test("5 wrong passwords lock that account, even for the right password", async () => {
  const person = await signUp(base, { name: "Target" });
  await wrongPasswords(person.email, 5);

  const res = await client(base).post("/login", { email: person.email, password: person.password });
  assert.equal(res.status, 429);
  assert.equal(res.headers.get("retry-after"), "900", "wait 15 minutes");
});

test("other accounts aren't affected", async () => {
  const target = await signUp(base, { name: "Locked" });
  const bystander = await signUp(base, { name: "Fine" });
  await wrongPasswords(target.email, 5);
  const res = await client(base).post("/login", { email: bystander.email, password: bystander.password });
  assert.equal(res.status, 200);
});

test("the lock lifts once the failures are 15 minutes old", async () => {
  const person = await signUp(base, { name: "Patient" });
  await wrongPasswords(person.email, 5);
  db.prepare("UPDATE login_failures SET failed_at = ? WHERE email = ?").run(
    new Date(Date.now() - 16 * 60 * 1000).toISOString(),
    person.email,
  );
  const res = await client(base).post("/login", { email: person.email, password: person.password });
  assert.equal(res.status, 200);
});

test("a correct login clears earlier failures", async () => {
  const person = await signUp(base, { name: "Clumsy" });
  await wrongPasswords(person.email, 4);
  await client(base).post("/login", { email: person.email, password: person.password });
  await wrongPasswords(person.email, 4);
  const res = await client(base).post("/login", { email: person.email, password: person.password });
  assert.equal(res.status, 200);
});

test("guessing the current password on Change password is limited too", async () => {
  const person = await signUp(base, { name: "Guessed" });
  for (let i = 0; i < 5; i++) {
    await person.put("/me/password", { currentPassword: "guess", newPassword: "newpass1" });
  }
  const res = await person.put("/me/password", { currentPassword: person.password, newPassword: "newpass1" });
  assert.equal(res.status, 429);
});

// Last in this file: it locks out this test file's whole computer (127.0.0.1).
test("50 wrong passwords from one computer, across any emails, lock that computer", async () => {
  const person = await signUp(base, { name: "Victim" });
  await Promise.all(Array.from({ length: 50 }, (_, i) => wrongPasswords(`nobody${i}@test.dev`, 1)));
  const res = await client(base).post("/login", { email: person.email, password: person.password });
  assert.equal(res.status, 429);
});
