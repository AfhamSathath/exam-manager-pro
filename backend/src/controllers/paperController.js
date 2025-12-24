import Paper from "../models/paperModel.js";
import fs from "fs";

// -----------------------------
// Create Paper (draft)
// -----------------------------
export const createPaper = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "PDF required" });

    const { year, semester, courseName, paperType } = req.body;
    const pdfUrl = req.file.path.replace(/\\/g, "/");

    const paper = await Paper.create({
      year,
      semester,
      courseName,
      paperType,
      pdfUrl,
      status: "draft",
    });

    res.status(201).json(paper);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// -----------------------------
// Submit Paper (draft / revision_required → pending_moderation)
// -----------------------------
export const submitPaper = async (req, res) => {
  try {
    const paper = await Paper.findById(req.params.id);
    if (!paper) return res.status(404).json({ message: "Paper not found" });

    if (!["draft", "revision_required"].includes(paper.status)) {
      return res
        .status(400)
        .json({ message: `Cannot submit paper in status '${paper.status}'` });
    }

    paper.status = "pending_moderation";
    await paper.save();

    res.json({ message: "Submitted for moderation", paper });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// -----------------------------
// Update Paper
// -----------------------------
export const updatePaper = async (req, res) => {
  try {
    const paper = await Paper.findById(req.params.id);
    if (!paper) return res.status(404).json({ message: "Paper not found" });

    const { year, semester, courseName, paperType } = req.body;

    if (req.file && paper.pdfUrl && fs.existsSync(paper.pdfUrl)) {
      fs.unlinkSync(paper.pdfUrl);
    }

    if (req.file) {
      paper.pdfUrl = req.file.path.replace(/\\/g, "/");
    }

    paper.year = year || paper.year;
    paper.semester = semester || paper.semester;
    paper.courseName = courseName || paper.courseName;
    paper.paperType = paperType || paper.paperType;

    const updated = await paper.save();
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// -----------------------------
// Delete Paper
// -----------------------------
export const deletePaper = async (req, res) => {
  try {
    const paper = await Paper.findById(req.params.id);
    if (!paper) return res.status(404).json({ message: "Paper not found" });

    if (paper.pdfUrl && fs.existsSync(paper.pdfUrl)) {
      fs.unlinkSync(paper.pdfUrl);
    }

    await paper.deleteOne();
    res.json({ message: "Deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// -----------------------------
// Get All / Get by ID
// -----------------------------
export const getAllPapers = async (req, res) => {
  try {
    const papers = await Paper.find().sort({ createdAt: -1 });
    res.json(papers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getPaperById = async (req, res) => {
  try {
    const paper = await Paper.findById(req.params.id);
    if (!paper) return res.status(404).json({ message: "Paper not found" });
    res.json(paper);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

//
// ======================================================
// ✅ NEW: Examiner routes (MATCH FRONTEND)
// ======================================================
//

// -----------------------------
// Examiner requests revision
// pending_moderation → revision_required
// -----------------------------
export const examinerRequestRevision = async (req, res) => {
  try {
    const { comment } = req.body;

    const paper = await Paper.findById(req.params.id);
    if (!paper) return res.status(404).json({ message: "Paper not found" });

    if (paper.status !== "pending_moderation") {
      return res.status(400).json({ message: "Paper not in moderation state" });
    }

    paper.status = "revision_required";
    paper.examinerComment = comment || "";
    paper.examinerReviewedAt = new Date();

    await paper.save();

    res.json({ message: "Revision requested", paper });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// -----------------------------
// Examiner approves paper
// pending_moderation → pending_approval
// -----------------------------
export const examinerApprovePaper = async (req, res) => {
  try {
    const paper = await Paper.findById(req.params.id);
    if (!paper) return res.status(404).json({ message: "Paper not found" });

    if (paper.status !== "pending_moderation") {
      return res.status(400).json({ message: "Paper not in moderation state" });
    }

    paper.status = "pending_approval";
    paper.examinerReviewedAt = new Date();

    await paper.save();

    res.json({ message: "Approved by examiner", paper });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// -----------------------------
// HOD approves paper
// pending_approval → approved
// -----------------------------
export const hodApprove = async (req, res) => {
  try {
    const paper = await Paper.findById(req.params.id);
    if (!paper) return res.status(404).json({ message: "Paper not found" });

    if (paper.status !== "pending_approval") {
      return res.status(400).json({ message: "Cannot approve this paper" });
    }

    paper.status = "approved";
    await paper.save();

    res.json({ message: "HOD approved", paper });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// -----------------------------
// Mark paper as printed
// approved → printed
// -----------------------------
export const markAsPrinted = async (req, res) => {
  try {
    const paper = await Paper.findById(req.params.id);
    if (!paper) return res.status(404).json({ message: "Paper not found" });

    if (paper.status !== "approved") {
      return res.status(400).json({ message: "Only approved papers can be printed" });
    }

    paper.status = "printed";
    await paper.save();

    res.json({ message: "Paper marked as printed", paper });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
