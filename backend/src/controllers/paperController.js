import Paper from "../models/paperModel.js";
import fs from "fs";
import path from "path";

/**
 * Convert stored URL path -> absolute filesystem path
 * Example:
 *   /uploads/papers/file.pdf
 *   => E:/project/backend/uploads/papers/file.pdf
 */
const getFilePathFromUrl = (urlPath) => {
  return path.join(process.cwd(), urlPath);
};

// -----------------------------
// Create Paper (Lecturer)
// -----------------------------
export const createPaper = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "PDF required" });
    }

    const { year, semester, courseCode, courseName, paperType } = req.body;

    // ✅ ALWAYS store URL path, never filesystem path
    const pdfUrl = `/uploads/papers/${req.file.filename}`;

    const paper = await Paper.create({
      year,
      semester,
      courseCode,
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

    if (!["draft", "revision_required"].includes(paper.status)) {
      return res.status(400).json({
        message: `Cannot submit paper in status '${paper.status}'`,
      });
    }

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

    // ✅ Delete old PDF if a new one is uploaded
    if (req.file && paper.pdfUrl) {
      const oldFilePath = getFilePathFromUrl(paper.pdfUrl);
      if (fs.existsSync(oldFilePath)) {
        fs.unlinkSync(oldFilePath);
      }
    }

    // ✅ Save new PDF URL
    if (req.file) {
      paper.pdfUrl = `/uploads/papers/${req.file.filename}`;
      paper.status = "pending_moderation";
    }

    const updated = await paper.save();
    req.app.get("io")?.emit("paperUpdated", updated);

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

    if (paper.pdfUrl) {
      const filePath = getFilePathFromUrl(paper.pdfUrl);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await paper.deleteOne();
    res.json({ message: "Deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// -----------------------------
// Get All Papers (Role-based)
// -----------------------------
export const getAllPapers = async (req, res) => {
  try {
    let query = {};

    if (req.query.status) {
      query.status = req.query.status;
    }

    if (req.user.role === "lecturer") {
      query.lecturerId = req.user.id;
    } else if (req.user.role === "examiner") {
      const courseCodes = req.user.courses?.map((c) => c.code) || [];
      query.courseCode = { $in: courseCodes };
    }

    const papers = await Paper.find(query)
      .populate("lecturerId", "name")
      .populate("examinerId", "name")
      .sort({ createdAt: -1 });

    res.json(papers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// -----------------------------
// Get Single Paper
// -----------------------------
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
  const { comment } = req.body;
  if (!comment) {
    return res.status(400).json({ message: "Comment required" });
  }

  try {
    const paper = await Paper.findById(req.params.id);
    if (!paper) return res.status(404).json({ message: "Paper not found" });

    paper.status = "revision_required";
    paper.examinerId = req.user.id;
    paper.moderationComments = paper.moderationComments || [];

    paper.moderationComments.push({
      commentByName: req.user.name,
      comment,
      createdAt: new Date(),
    });

    await paper.save();
    req.app.get("io")?.emit("paperUpdated", paper);

    res.json({ message: "Revision requested", paper });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// -----------------------------
// Examiner: Approve Paper (Send to HOD)
// -----------------------------
export const examinerApprovePaper = async (req, res) => {
  try {
    const paper = await Paper.findById(req.params.id);
    if (!paper) return res.status(404).json({ message: "Paper not found" });

    paper.status = "pending_approval";
    paper.examinerId = req.user.id;
    await paper.save();

    req.app.get("io")?.emit("paperUpdated", paper);
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

    if (paper.status !== "pending_approval") {
      return res.status(400).json({ message: "Cannot approve this paper" });
    }

    paper.status = "approved";
    await paper.save();

    const populated = await Paper.findById(req.params.id)
      .populate("lecturerId", "name")
      .populate("examinerId", "name");

    req.app.get("io")?.emit("paperUpdated", populated);
    res.json({ message: "HOD approved paper", paper: populated });
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

    if (paper.status !== "approved") {
      return res
        .status(400)
        .json({ message: "Only approved papers can be printed" });
    }

    paper.status = "printed";
    await paper.save();

    res.json({ message: "Paper marked as printed", paper });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// -----------------------------
// HOD: Pending Approvals
// -----------------------------
export const getPendingApprovals = async (req, res) => {
  try {
    const papers = await Paper.find({
      status: { $in: ["pending_approval", "approved"] },
    })
      .populate("lecturerId", "name")
      .populate("examinerId", "name");

    const formatted = papers.map((p) => ({
      _id: p._id,
      courseName: p.courseName,
      year: p.year,
      semester: p.semester,
      paperType: p.paperType,
      pdfUrl: p.pdfUrl,
      status: p.status,
      lecturerName: p.lecturerId?.name || "N/A",
      examinerName: p.examinerId?.name || "N/A",
      moderationComments: p.moderationComments || [],
    }));

    res.json(formatted);
  } catch (err) {
    console.error("getPendingApprovals error:", err);
    res.status(500).json({ message: "Server error fetching papers" });
  }
};

// -----------------------------
// Moderated Papers
// -----------------------------
export const getModeratedPapers = async (req, res) => {
  try {
    const papers = await Paper.find({
      status: { $in: ["approved", "rejected"] },
    })
      .populate("lecturerId", "name")
      .populate("examinerId", "name")
      .sort({ createdAt: -1 });

    res.json(papers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// -----------------------------
// Approved Papers (Public / HOD)
// -----------------------------
export const getApprovedPapers = async (req, res) => {
  try {
    const papers = await Paper.find({ status: "approved" })
      .populate("lecturerId", "name")
      .populate("examinerId", "name")
      .sort({ updatedAt: -1 });

    res.json(papers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PATCH /papers/:id/revise
export const revisePaper = async (req, res) => {
  const { id } = req.params;
  if (!req.file) return res.status(400).json({ message: "PDF required" });

  try {
    const paper = await Paper.findById(id);
    if (!paper) return res.status(404).json({ message: "Paper not found" });

    paper.pdfUrl = `/uploads/${req.file.filename}`;
    paper.status = "revision_submitted"; // optional, depending on your workflow
    await paper.save();

    res.json({ message: "Paper revised successfully", paper });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to revise paper" });
  }
};
