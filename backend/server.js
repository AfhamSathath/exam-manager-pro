// server.js
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import mongoose from "mongoose";
import path from "path";

import paperRoutes from "./src/routes/paperRoutes.js";
import authRoutes from "./src/routes/authRoutes.js"; // if you have auth routes

dotenv.config();

const app = express();

// -----------------------------
// Middleware
// -----------------------------
app.use(cors());
app.use(express.json());

// -----------------------------
// Static folder for uploaded PDFs
// -----------------------------
app.use("/uploads/papers", express.static(path.join(process.cwd(), "uploads/papers")));

// -----------------------------
// Routes
// -----------------------------
app.use("/api/papers", paperRoutes);
app.use("/api/auth", authRoutes); // if you have auth routes

// -----------------------------
// MongoDB connection
// -----------------------------
const PORT = process.env.PORT || 5001;

mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("MongoDB connected");
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err.message);
    process.exit(1);
  });
