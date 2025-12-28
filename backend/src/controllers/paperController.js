// backend/src/controllers/paperController.js
import Paper from "../models/paperModel.js";
import fs from "fs";

// -----------------------------
// Create Paper (Lecturer)
// -----------------------------
export const createPaper = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "PDF required" });

    const { LecturerName, year, semester, courseName, paperType } = req.body;
    const pdfUrl = req.file.path.replace(process.cwd().replace(/\\/g, "/"), "").replace(/\\/g, "/");

    const paper = await Paper.create({
      LecturerName,
      year,
      semester,
      courseName,
      paperType,
      pdfUrl,
      status: "draft",
      lecturerId: req.user.id,
    });

    res.status(201).json(paper);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// -----------------------------
// Submit Paper (Lecturer)
// -----------------------------
export const submitPaper = async (req, res) => {
  try {
    const paper = await Paper.findById(req.params.id);
    if (!paper) return res.status(404).json({ message: "Paper not found" });

    if (!["draft", "revision_required"].includes(paper.status))
      return res.status(400).json({ message: `Cannot submit paper in status '${paper.status}'` });

    paper.status = "pending_moderation";
    await paper.save();

    res.json({ message: "Submitted for moderation", paper });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// -----------------------------
// Update Paper (Lecturer)
// -----------------------------
export const updatePaper = async (req, res) => {
  try {
    const paper = await Paper.findById(req.params.id);
    if (!paper) return res.status(404).json({ message: "Paper not found" });

    const { year, semester, courseName, paperType } = req.body;

    // Delete old PDF if replaced
    if (req.file && paper.pdfUrl && fs.existsSync(paper.pdfUrl)) {
      fs.unlinkSync(paper.pdfUrl);
    }

    if (req.file) paper.pdfUrl = req.file.path.replace(process.cwd().replace(/\\/g, "/"), "").replace(/\\/g, "/");
    paper.year = year || paper.year;
    paper.semester = semester || paper.semester;
    paper.courseName = courseName || paper.courseName;
    paper.paperType = paperType || paper.paperType;

    // Reset status for revision
    if (req.file) paper.status = "pending_moderation";

    const updated = await paper.save();
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// -----------------------------
// Delete Paper (Lecturer)
// -----------------------------
export const deletePaper = async (req, res) => {
  try {
    const paper = await Paper.findById(req.params.id);
    if (!paper) return res.status(404).json({ message: "Paper not found" });

    if (paper.pdfUrl && fs.existsSync(paper.pdfUrl)) fs.unlinkSync(paper.pdfUrl);

    await paper.deleteOne();
    res.json({ message: "Deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// -----------------------------
// Get All / Get By ID
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

// -----------------------------
// Examiner: Request Revision
// -----------------------------
export const examinerModerationRequestRevision = async (req, res) => {
  const { id } = req.params;
  const { comment } = req.body;
  if (!comment) return res.status(400).json({ message: "Comment required" });

  try {
    const paper = await Paper.findById(id);
    if (!paper) return res.status(404).json({ message: "Paper not found" });

    paper.status = "revision_required";
    paper.moderationComments = paper.moderationComments || [];
    paper.moderationComments.push({
      commentByName: req.user.fullName,
      comment,
      date: new Date(),
    });

    await paper.save();
    res.json({ message: "Revision requested", paper });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// -----------------------------
// Examiner: Approve Paper (send to HOD)
// -----------------------------
export const examinerApprovePaper = async (req, res) => {
  const { id } = req.params;

  try {
    const paper = await Paper.findById(id);
    if (!paper) return res.status(404).json({ message: "Paper not found" });

    paper.status = "pending_approval"; // HOD approval next
    await paper.save();
    res.json({ message: "Paper approved by examiner", paper });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// -----------------------------
// HOD: Approve Paper
// -----------------------------
export const hodApprove = async (req, res) => {
  try {
    const paper = await Paper.findById(req.params.id);
    if (!paper) return res.status(404).json({ message: "Paper not found" });

    if (paper.status !== "pending_approval")
      return res.status(400).json({ message: "Cannot approve this paper" });

    paper.status = "approved";
    await paper.save();
    res.json({ message: "HOD approved paper", paper });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// -----------------------------
// HOD: Mark as Printed
// -----------------------------
export const markAsPrinted = async (req, res) => {
  try {
    const paper = await Paper.findById(req.params.id);
    if (!paper) return res.status(404).json({ message: "Paper not found" });

    if (paper.status !== "approved")
      return res.status(400).json({ message: "Only approved papers can be printed" });

    paper.status = "printed";
    await paper.save();
    res.json({ message: "Paper marked as printed", paper });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET ALL MODERATED PAPERS (approved + rejected)
export const getModeratedPapers = async (req, res) => {
  try {
    const papers = await Paper.find({
      status: { $in: ["approved", "rejected"] },
    })
      .sort({ createdAt: -1 });

    res.status(200).json(papers);
  } catch (error) {
    console.error("getModeratedPapers error:", error);
    res.status(500).json({
      message: "Failed to fetch moderated papers",
    });
  }
};


export const getApprovedPapers = async (req, res) => {
  try {
    const papers = await Paper.find({ status: "approved" }).sort({ updatedAt: -1 });
    res.json(papers);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch approved papers" });
  }
};



export const getPendingApprovals = async (req, res) => {
  try {
    try {
    const papers = await Paper.find({ status: "pending_approval", examinerApproved: true });
    res.status(200).json(papers);
  } catch (error) {
    console.error("getPendingApprovals error:", error);
    res.status(500).json({
      message: "Failed to fetch pending approvals",
    });
  }
} catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch pending approvals" });
  }
}