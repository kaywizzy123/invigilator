import { randomInt, randomUUID } from "node:crypto";
import db, { inTransaction } from "./db.js";

// Join codes leave out letters and numbers that are easy to mix up (O/0, I/1/L).
const CODE_CHARACTERS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const CODE_LENGTH = 6;

const insertClass = db.prepare(`
  INSERT INTO classes (id, teacher_id, name, code, created_at) VALUES (?, ?, ?, ?, ?)
`);

const findClassesByTeacher = db.prepare(`
  SELECT classes.id, classes.name, classes.code, classes.created_at AS createdAt,
         (SELECT COUNT(*) FROM class_members WHERE class_members.class_id = classes.id) AS studentCount
  FROM classes
  WHERE classes.teacher_id = ?
  ORDER BY classes.name
`);

const findClass = db.prepare(`
  SELECT id, teacher_id AS teacherId, name, code, created_at AS createdAt
  FROM classes
  WHERE id = ?
`);

const findClassByCodeQuery = db.prepare(`
  SELECT classes.id, classes.name, users.fullname AS teacherName
  FROM classes
  JOIN users ON users.id = classes.teacher_id
  WHERE classes.code = ?
`);

const findMembers = db.prepare(`
  SELECT users.id, users.fullname, users.email, class_members.joined_at AS joinedAt
  FROM class_members
  JOIN users ON users.id = class_members.student_id
  WHERE class_members.class_id = ?
  ORDER BY users.fullname
`);

// The exams set for one class, and how many classes each exam is set for in total.
const findExamsForClass = db.prepare(`
  SELECT exams.id, exams.title, exams.published_at AS publishedAt,
         (SELECT COUNT(*) FROM exam_classes AS other WHERE other.exam_id = exams.id) AS classCount
  FROM exam_classes
  JOIN exams ON exams.id = exam_classes.exam_id
  WHERE exam_classes.class_id = ?
  ORDER BY exams.title
`);

// Its members and exam links go too, through ON DELETE CASCADE.
const deleteClassRow = db.prepare(`DELETE FROM classes WHERE id = ?`);

// OR IGNORE: joining a class you're already in does nothing.
const insertMember = db.prepare(`
  INSERT OR IGNORE INTO class_members (class_id, student_id, joined_at) VALUES (?, ?, ?)
`);

const deleteMember = db.prepare(`
  DELETE FROM class_members WHERE class_id = ? AND student_id = ?
`);

const findClassesForStudent = db.prepare(`
  SELECT classes.id, classes.name, users.fullname AS teacherName
  FROM class_members
  JOIN classes ON classes.id = class_members.class_id
  JOIN users ON users.id = classes.teacher_id
  WHERE class_members.student_id = ?
  ORDER BY classes.name
`);

const findClassesForExamQuery = db.prepare(`
  SELECT classes.id, classes.name
  FROM exam_classes
  JOIN classes ON classes.id = exam_classes.class_id
  WHERE exam_classes.exam_id = ?
  ORDER BY classes.name
`);

const findStudentInExamClass = db.prepare(`
  SELECT 1
  FROM exam_classes
  JOIN class_members ON class_members.class_id = exam_classes.class_id
  WHERE exam_classes.exam_id = ? AND class_members.student_id = ?
`);

// Which of the exam's classes a student is in (usually one).
const findStudentClassesForExamQuery = db.prepare(`
  SELECT classes.id, classes.name
  FROM class_members
  JOIN exam_classes ON exam_classes.class_id = class_members.class_id
  JOIN classes ON classes.id = class_members.class_id
  WHERE exam_classes.exam_id = ? AND class_members.student_id = ?
  ORDER BY classes.name
`);

const deleteExamClasses = db.prepare(`DELETE FROM exam_classes WHERE exam_id = ?`);

const insertExamClass = db.prepare(`
  INSERT INTO exam_classes (exam_id, class_id) VALUES (?, ?)
`);

function randomCode() {
  let code = "";
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += CODE_CHARACTERS[randomInt(CODE_CHARACTERS.length)];
  }
  return code;
}

export async function createClass(teacherId, name) {
  // Pick a code no other class has. With about 900 million possible codes, this
  // almost always works first time.
  let code = randomCode();
  while (findClassByCodeQuery.get(code)) {
    code = randomCode();
  }
  const schoolClass = { id: randomUUID(), name, code, createdAt: new Date().toISOString(), studentCount: 0 };
  insertClass.run(schoolClass.id, teacherId, name, code, schoolClass.createdAt);
  return schoolClass;
}

export async function listClassesByTeacher(teacherId) {
  return findClassesByTeacher.all(teacherId);
}

// The class with its students and the exams set for it, or null.
export async function findClassById(classId) {
  const schoolClass = findClass.get(classId);
  if (!schoolClass) return null;
  return { ...schoolClass, students: findMembers.all(classId), exams: findExamsForClass.all(classId) };
}

export async function deleteClass(classId) {
  deleteClassRow.run(classId);
}

export async function findClassByCode(code) {
  return findClassByCodeQuery.get(code) ?? null;
}

export async function joinClass(classId, studentId) {
  insertMember.run(classId, studentId, new Date().toISOString());
}

export async function removeStudentFromClass(classId, studentId) {
  deleteMember.run(classId, studentId);
}

export async function listClassesForStudent(studentId) {
  return findClassesForStudent.all(studentId);
}

// The classes an exam is set for.
export async function findClassesForExam(examId) {
  return findClassesForExamQuery.all(examId);
}

// Replaces the list of classes an exam is set for.
export async function setExamClasses(examId, classIds) {
  inTransaction(() => {
    deleteExamClasses.run(examId);
    for (const classId of classIds) {
      insertExamClass.run(examId, classId);
    }
  });
}

// True if the student is in at least one of the classes the exam is set for.
export async function isStudentInExamClass(examId, studentId) {
  return Boolean(findStudentInExamClass.get(examId, studentId));
}

export async function findStudentClassesForExam(examId, studentId) {
  return findStudentClassesForExamQuery.all(examId, studentId);
}
