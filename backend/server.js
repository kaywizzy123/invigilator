import cookieParser from "cookie-parser";
import express from "express";
import authRoutes from "./routes/auth.js";
import examRoutes from "./routes/exams.js";
import studentRoutes from "./routes/student.js";
import classRoutes from "./routes/classes.js";
import imageRoutes from "./routes/images.js";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cookieParser());

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api", authRoutes);
app.use("/api", examRoutes);
app.use("/api", studentRoutes);
app.use("/api", classRoutes);
app.use("/api", imageRoutes);

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
