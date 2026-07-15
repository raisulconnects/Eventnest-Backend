import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import connectDB from "./config/db";
import { errorHandler } from "./middleware/errorMiddleware";
import authRoutes from "./routes/authRoutes";
import eventRoutes from "./routes/eventRoutes";
import reviewRoutes from "./routes/reviewRoutes";
import userRoutes from "./routes/userRoutes";
import reservationRoutes from "./routes/reservationRoutes";
import contactRoutes from "./routes/contactRoutes";

const app = express();

connectDB();

app.set("query parser", "extended");

app.use(
  cors({
    origin: (process.env.CLIENT_URL || "http://localhost:3000").replace(/\/+$/, ""),
    credentials: true,
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/events", eventRoutes);
app.use("/api/v1/reviews", reviewRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/reservations", reservationRoutes);
app.use("/api/v1/contacts", contactRoutes);

app.get("/api/v1/health", (_req, res) => {
  res.json({ success: true, message: "EventNest API is running" });
});

app.use(errorHandler);

export default app;
