import express from "express";
import multer from "multer";
import fs from "fs";
import path from "path";

import {
  createPaper,
  revisePaper,
  submitPaper,
  updatePaper,
  deletePaper,
  getAllPapers,
  getPaperById,
  examinerModerationRequestRevision,
  examinerApprovePaper,
  hodApprove,
  markAsPrinted,
  getModeratedPapers,
  getApprovedPapers,
  getPendingApprovals,
} from "../controllers/paperController.js";

import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();

// -----------------------------
// Multer setup for file uploads
// -----------------------------
const uploadDir = path.join(process.cwd(), "uploads/papers");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});

const uploads = multer({ storage });

// -----------------------------
// Lecturer routes
// -----------------------------
router.post("/", protect, authorize("lecturer"), uploads.single("pdf"), createPaper);
router.put("/:id", protect, authorize("lecturer"), uploads.single("pdf"), updatePaper);
router.patch("/:id/submit", protect, authorize("lecturer"), submitPaper);
router.delete("/:id", protect, authorize("lecturer"), deletePaper);
router.patch("/:id/revise", protect, authorize("lecturer"), uploads.single("pdf"), revisePaper);

// -----------------------------
// Examiner routes
// -----------------------------
router.patch("/:id/revision", protect, authorize("examiner"), examinerModerationRequestRevision);
router.patch("/:id/approve/examiner", protect, authorize("examiner"), examinerApprovePaper);

// -----------------------------
// HOD & Public routes (static FIRST)
// -----------------------------
router.get("/pending-approvals", protect, authorize("hod"), getPendingApprovals);
router.get("/hod/approved", protect, authorize("hod"), getApprovedPapers);
router.get("/moderated", protect, authorize("examiner", "hod"), getModeratedPapers);
router.patch("/:id/approve", protect, authorize("hod"), hodApprove);
router.patch("/:id/print", protect, authorize("hod"), markAsPrinted);

// -----------------------------
// Generic / dynamic routes (LAST)
// -----------------------------
router.get("/:id", protect, authorize(), getPaperById);
router.get("/", protect, getAllPapers);

router.get("/hod/printed", protect, authorize("hod"), async (req, res) => {
  try {
    const papers = await Paper.find({ status: "printed" });
    res.json(papers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
