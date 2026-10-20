# Invigilator

An online exam app for schools. Teachers set exams for their classes; students sit them against the clock; answers are marked automatically.

> **Status:** prototype. It runs locally with a SQLite database and is not yet deployed or hardened for real-world use.

## Features

### For teachers

- **Classes:** create a class and share its 6-character join code with students.
- **Exam builder** with four question types:
  - multiple choice (2–6 options, one correct answer)
  - multiple answers ("tick all that apply", marked all-or-nothing)
  - true / false
  - short answer (matches any accepted answer, ignoring capitals and extra spaces)
- **Publishing:** set an exam for one or more classes, publish it, close it to stop new starts, and reopen it later.
- **Exam management:** edit an exam until a student starts it (after that it's locked to keep results fair), duplicate it to reuse or fix it, and delete it while no one has sat it.
- **Results:** class average, highest and lowest scores, how many students got each question right, and each student's full answers. Filter by class and download results as CSV for Excel or Google Sheets.

### For students

- Join classes with a code and see the exams set for them.
- Sit exams one question at a time, with a countdown timer, a progress bar and a question navigator.
- Answers save as you go, so refreshing or losing connection doesn't lose work.
- See your score and a full review of your answers as soon as you hand in.

### Fair by design

- Questions and options are shuffled differently for each student.
- The time limit is enforced on the server. When time runs out, the exam is handed in automatically with the answers saved so far.
- Each student gets one attempt per exam.
- Correct answers are never sent to the browser before an exam is handed in.
- Students can't navigate away from an exam until they hand it in.

## Tech stack

| Part | Built with |
| --- | --- |
| Frontend | React 19, Vite, Tailwind CSS v4, React Router (data router), lucide-react icons |
| Backend | Node.js, Express 5, `node:sqlite` (Node's built-in SQLite) |
| Auth | Cookie sessions; passwords hashed with scrypt |

## Getting started

### Requirements

- [Node.js](https://nodejs.org/) **22.13 or later** (24 recommended). The backend uses the built-in `node:sqlite` module and `--env-file-if-exists`.

### 1. Install

```bash
git clone https://github.com/kaywizzy123/invigilator.git
cd invigilator
cd backend && npm install
cd ../frontend && npm install
```

### 2. Set a teacher code

Anyone who signs up with this code becomes a teacher; everyone else is a student. Create `backend/.env`:

```bash
TEACHER_CODE=choose-a-secret-code
```

This file is in `.gitignore`, so the code is never committed. Without it, nobody can sign up as a teacher.

### 3. Run

Use two terminals:

```bash
# Terminal 1: backend on http://localhost:3000 (restarts when you save)
cd backend
npm run dev
```

```bash
# Terminal 2: frontend on http://localhost:5173 (sends /api requests to the backend)
cd frontend
npm run dev
```

Open **<http://localhost:5173>**. The database is created automatically at `backend/data/app.db` the first time the backend starts.

### 4. Try it out

1. **Sign up as a teacher** using the code from your `.env`.
2. Go to **Classes** and create a class. Note its join code.
3. Create an exam from the **Dashboard**, set it for your class with **Classes**, then **Publish** it.
4. In a different browser (or a private window), **sign up as a student** without a code, join the class with the code, and sit the exam.
5. Back as the teacher, open the exam's **Results**.

## Project structure

```text
backend/
  server.js        Express app and route setup
  db.js            Database connection, tables and small migrations
  users.js         Users and password hashing
  sessions.js      Login sessions
  exams.js         Exams and questions
  attempts.js      Students' attempts and saved answers
  classes.js       Classes, members and which classes each exam is for
  marking.js       Deadlines and marking rules
  layout.js        Per-student shuffling of questions and options
  middleware.js    requireAuth / requireTeacher / requireStudent
  routes/          API routes: auth, exams (teacher), student, classes

frontend/src/
  router.jsx       All pages and their loaders and actions
  pages/           One component per page
  components/      Shared pieces: forms, dialogs, fields, navbar
  loaders/         Load data before a page shows
  actions/         Handle form submissions
```

All SQL lives in the backend's top-level `.js` files (not in the routes), so SQLite can later be swapped for a hosted database.

## Checking your changes

```bash
cd frontend
npx eslint src   # lint
npm run build    # production build
```
