// backend/src/routes/paperRoutes.js
import express from "express";
import multer from "multer";
import fs from "fs";
import path from "path";

import {
  createPaper,
  submitPaper,
  updatePaper,
  deletePaper,
  getAllPapers,
  getPaperById,
  examinerModerationRequestRevision,
  examinerApprovePaper,
  hodApprove,
  markAsPrinted,
} from "../controllers/paperController.js";

import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();

// -----------------------------
// Multer setup
// -----------------------------
const uploadDir = path.join(process.cwd(), "uploads/papers");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});

const upload = multer({ storage });

// -----------------------------
// Lecturer routes
// -----------------------------
router.post("/", protect, authorize("lecturer"), upload.single("pdf"), createPaper);
router.put("/:id", protect, authorize("lecturer"), upload.single("pdf"), updatePaper);
router.patch("/:id/submit", protect, authorize("lecturer"), submitPaper);
router.delete("/:id", protect, authorize("lecturer"), deletePaper);

// -----------------------------
// Examiner routes
// -----------------------------
router.patch("/:id/revision", protect, authorize("examiner"), examinerModerationRequestRevision);
router.patch("/:id/approve/examiner", protect, authorize("examiner"), examinerApprovePaper);

// -----------------------------
// HOD routes
// -----------------------------
router.patch("/:id/approve", protect, authorize("hod"), hodApprove);
router.patch("/:id/print", protect, authorize("hod"), markAsPrinted);

// -----------------------------
// Public/Authenticated routes
// -----------------------------
router.get("/", protect, getAllPapers);
router.get("/:id", protect, getPaperById);

export default router;
