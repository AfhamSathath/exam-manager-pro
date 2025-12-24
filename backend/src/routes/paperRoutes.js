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
  examinerRequestRevision,
  examinerApprovePaper,
  hodApprove,
  markAsPrinted,
} from "../controllers/paperController.js";

import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();

// =====================================================
// Multer setup for PDF uploads
// =====================================================
const uploadDir = path.join(process.cwd(), "uploads/papers");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const upload = multer({ storage });

// =====================================================
// Lecturer Routes
// =====================================================

// Create a new paper (draft)
router.post(
  "/",
  protect,
  authorize("lecturer"),
  upload.single("pdf"),
  createPaper
);

// Submit a paper for moderation
router.patch(
  "/:id/submit",
  protect,
  authorize("lecturer"),
  submitPaper
);

// Update a paper (revision or normal edit)
router.patch(
  "/:id",
  protect,
  authorize("lecturer"),
  upload.single("pdf"),
  updatePaper
);

// Delete a draft paper
router.delete(
  "/:id",
  protect,
  authorize("lecturer"),
  deletePaper
);

// =====================================================
// Examiner Routes
// =====================================================

// Request a revision (adds comment)
router.patch(
  "/:id/revision",
  protect,
  authorize("examiner"),
  examinerRequestRevision
);

// Approve paper by examiner
router.patch(
  "/:id/approve/examiner",
  protect,
  authorize("examiner"),
  examinerApprovePaper
);

// =====================================================
// HOD Routes
// =====================================================

// HOD approves the paper
router.patch(
  "/:id/approve",
  protect,
  authorize("hod"),
  hodApprove
);

// Mark paper as printed
router.patch(
  "/:id/print",
  protect,
  authorize("hod"),
  markAsPrinted
);

// =====================================================
// Common / Fetch Routes
// =====================================================

// Get all papers (lecturer sees only their own in frontend filter)
router.get("/", protect, getAllPapers);

// Get paper by ID
router.get("/:id", protect, getPaperById);

export default router;
