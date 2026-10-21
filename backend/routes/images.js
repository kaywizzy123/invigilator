import express, { Router } from "express";
import { detectImageType, findImageById, saveImage } from "../images.js";
import { requireAuth, requireTeacher } from "../middleware.js";

const router = Router();

const MAX_IMAGE_SIZE = "2mb";

// Upload one image. The browser sends the file itself as the request body.
// express.raw reads it as bytes (a Buffer), up to the size limit.
router.post(
  "/images",
  requireAuth,
  requireTeacher,
  express.raw({ type: () => true, limit: MAX_IMAGE_SIZE }),
  async (req, res) => {
    const bytes = Buffer.isBuffer(req.body) ? req.body : Buffer.alloc(0);
    const type = detectImageType(bytes);
    if (!type) {
      return res.status(400).json({ error: "Only PNG, JPEG, GIF or WebP images can be added." });
    }
    res.status(201).json({ imageId: await saveImage(req.user.id, bytes, type) });
  },
);

// Show an image. Any logged-in user may see it: students need to, to sit the exam.
router.get("/images/:imageId", requireAuth, async (req, res) => {
  const image = await findImageById(req.params.imageId);
  if (!image) {
    return res.status(404).json({ error: "Image not found." });
  }
  res.set({
    "Content-Type": image.mimeType,
    // Never let the browser guess a different type from the contents.
    "X-Content-Type-Options": "nosniff",
    // Images never change once uploaded, so browsers may keep them for a day.
    "Cache-Control": "private, max-age=86400",
  });
  // dotfiles: "allow" because sendFile otherwise refuses any path with a folder starting
  // with "." (e.g. a project stored under ~/.apps/). That's safe here: the path is built by
  // the server from the image's stored id, never from anything a user typed.
  res.sendFile(image.path, { dotfiles: "allow" });
});

// A file over the size limit: reply in the same JSON shape as other errors.
router.use((error, req, res, next) => {
  if (error.type === "entity.too.large") {
    return res.status(413).json({ error: `That image is too big. The limit is ${MAX_IMAGE_SIZE.toUpperCase()}.` });
  }
  next(error);
});

export default router;
