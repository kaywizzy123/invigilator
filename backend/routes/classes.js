import { Router } from "express";
import {
  createClass,
  deleteClass,
  findClassByCode,
  findClassById,
  joinClass,
  listClassesByTeacher,
  listClassesForStudent,
  removeStudentFromClass,
} from "../classes.js";
import { requireAuth, requireStudent, requireTeacher } from "../middleware.js";

const router = Router();

// Finds a class that belongs to the logged-in teacher, or null.
async function findOwnClass(req) {
  const schoolClass = await findClassById(req.params.classId);
  return schoolClass && schoolClass.teacherId === req.user.id ? schoolClass : null;
}

// ----- Teachers -----

router.get("/classes", requireAuth, requireTeacher, async (req, res) => {
  res.json({ classes: await listClassesByTeacher(req.user.id) });
});

router.post("/classes", requireAuth, requireTeacher, async (req, res) => {
  const name = String(req.body.name ?? "").trim();
  if (!name) {
    return res.status(400).json({ error: "Give the class a name, like \"Year 9A\"." });
  }
  res.status(201).json({ class: await createClass(req.user.id, name) });
});

// One class with its join code and students.
router.get("/classes/:classId", requireAuth, requireTeacher, async (req, res) => {
  const schoolClass = await findOwnClass(req);
  if (!schoolClass) {
    return res.status(404).json({ error: "Class not found." });
  }
  res.json({ class: schoolClass });
});

// Students' results are kept: their attempts belong to exams, not classes.
router.delete("/classes/:classId", requireAuth, requireTeacher, async (req, res) => {
  if (!(await findOwnClass(req))) {
    return res.status(404).json({ error: "Class not found." });
  }
  await deleteClass(req.params.classId);
  res.status(204).end();
});

router.delete("/classes/:classId/students/:studentId", requireAuth, requireTeacher, async (req, res) => {
  if (!(await findOwnClass(req))) {
    return res.status(404).json({ error: "Class not found." });
  }
  await removeStudentFromClass(req.params.classId, req.params.studentId);
  res.status(204).end();
});

// ----- Students -----

router.get("/student/classes", requireAuth, requireStudent, async (req, res) => {
  res.json({ classes: await listClassesForStudent(req.user.id) });
});

router.post("/student/classes/join", requireAuth, requireStudent, async (req, res) => {
  // Forgive lowercase and spaces: " k7q 2xm " becomes "K7Q2XM".
  const code = String(req.body.code ?? "").toUpperCase().replace(/\s/g, "");
  const schoolClass = code && (await findClassByCode(code));
  if (!schoolClass) {
    return res.status(404).json({ error: "No class has that code. Check it with your teacher." });
  }
  await joinClass(schoolClass.id, req.user.id);
  res.json({ class: schoolClass });
});

export default router;
