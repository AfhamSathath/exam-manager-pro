import express from "express";
import http from "http";
import { Server } from "socket.io";
import dotenv from "dotenv";
import cors from "cors";
import mongoose from "mongoose";
import path from "path";

// Keep src in the path since your files are there
import paperRoutes from "./src/routes/paperRoutes.js";
import authRoutes from "./src/routes/authRoutes.js";


dotenv.config();

const app = express();
const server = http.createServer(app);

// -----------------------------
// Socket.IO setup
// -----------------------------
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST", "PATCH"] },
});

io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);
});

// Make `io` global to use in controllers
app.set("io", io);

// -----------------------------
// Middleware
// -----------------------------
app.use(cors());
app.use(express.json());
app.use(
  "/uploads/papers",
  express.static(path.join(process.cwd(), "uploads/papers"))
);

// -----------------------------
// Routes
// -----------------------------
app.use("/api/papers", paperRoutes);
app.use("/api/auth", authRoutes);

// -----------------------------
// MongoDB connection & server
// -----------------------------
const PORT = process.env.PORT || 5001;

mongoose
  .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log("MongoDB connected");
    server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err.message);
    process.exit(1);
  });
