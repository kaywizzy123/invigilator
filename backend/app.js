import cookieParser from "cookie-parser";
import express from "express";
import authRoutes from "./routes/auth.js";
import examRoutes from "./routes/exams.js";
import studentRoutes from "./routes/student.js";
import classRoutes from "./routes/classes.js";
import imageRoutes from "./routes/images.js";

// The Express app, set up but not yet listening. server.js starts it on port 3000;
// tests start it on any free port.
const app = express();

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

export default app;
