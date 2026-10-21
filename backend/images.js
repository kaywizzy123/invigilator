import { randomUUID } from "node:crypto";
import { mkdirSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import { resolve, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import db from "./db.js";

// Uploaded image files are kept here (gitignored, like the database).
// Tests set UPLOADS_DIR to their own folder, so they never touch real uploads.
const UPLOADS_DIR = process.env.UPLOADS_DIR
  ? pathToFileURL(resolve(process.env.UPLOADS_DIR) + sep)
  : new URL("./uploads/", import.meta.url);
mkdirSync(UPLOADS_DIR, { recursive: true });

// The image types we accept, recognised by the first bytes of the file (its "magic number"),
// not by its name: renaming a file to photo.png doesn't make it a PNG.
// SVG is deliberately left out, because an SVG file can contain code that runs in the browser.
const IMAGE_TYPES = [
  {
    mime: "image/png",
    extension: "png",
    matches: (bytes) => bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
  },
  { mime: "image/jpeg", extension: "jpg", matches: (bytes) => bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff },
  {
    mime: "image/gif",
    extension: "gif",
    matches: (bytes) => ["GIF87a", "GIF89a"].includes(bytes.subarray(0, 6).toString("latin1")),
  },
  {
    mime: "image/webp",
    extension: "webp",
    matches: (bytes) =>
      bytes.subarray(0, 4).toString("latin1") === "RIFF" && bytes.subarray(8, 12).toString("latin1") === "WEBP",
  },
];

const insertImage = db.prepare(`
  INSERT INTO images (id, teacher_id, filename, mime_type, created_at) VALUES (?, ?, ?, ?, ?)
`);

const findImage = db.prepare(`
  SELECT id, teacher_id AS teacherId, filename, mime_type AS mimeType FROM images WHERE id = ?
`);

// Which accepted image type these bytes are, or null if they aren't one.
export function detectImageType(bytes) {
  if (bytes.length < 12) return null;
  return IMAGE_TYPES.find((type) => type.matches(bytes)) ?? null;
}

// Saves the file and records it. Returns the new image's id.
export async function saveImage(teacherId, bytes, type) {
  const id = randomUUID();
  const filename = `${id}.${type.extension}`;
  await writeFile(new URL(filename, UPLOADS_DIR), bytes);
  insertImage.run(id, teacherId, filename, type.mime, new Date().toISOString());
  return id;
}

// The image's record plus the full path of its file on disk, or null.
export async function findImageById(id) {
  const image = findImage.get(id);
  return image ? { ...image, path: fileURLToPath(new URL(image.filename, UPLOADS_DIR)) } : null;
}
