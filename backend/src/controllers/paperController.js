// backend/src/controllers/paperController.js
import Paper from "../models/paperModel.js";
import fs from "fs";

// -----------------------------
// Create Paper (Lecturer)
// -----------------------------
export const createPaper = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "PDF required" });

    const { year, semester, courseCode, courseName, paperType } = req.body;
    const pdfUrl = req.file.path.replace(process.cwd().replace(/\\/g, "/"), "").replace(/\\/g, "/");

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

    

    // Delete old PDF if replaced
    if (req.file && paper.pdfUrl && fs.existsSync(paper.pdfUrl)) {
      fs.unlinkSync(paper.pdfUrl);
    }

    if (req.file) paper.pdfUrl = req.file.path.replace(process.cwd().replace(/\\/g, "/"), "").replace(/\\/g, "/");
    

    // Reset status if new PDF uploaded
    if (req.file) paper.status = "pending_moderation";

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
    let query = {};
    if (req.query.status) query.status = req.query.status;

    if (req.user.role === "lecturer") query.lecturerId = req.user.id;
    else if (req.user.role === "examiner") {
      const courseCodes = req.user.courses?.map(c => c.code) || [];
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



// GET single paper with role-based access
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
// Examiner: Approve Paper (send to HOD)
// -----------------------------
export const examinerApprovePaper = async (req, res) => {
  const { id } = req.params;
  try {
    const paper = await Paper.findById(id);
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

    if (paper.status !== "pending_approval")
      return res.status(400).json({ message: "Cannot approve this paper" });

    await Paper.updateOne({ _id: req.params.id }, { status: "approved" });
    const updatedPaper = await Paper.findById(req.params.id)
      .populate("lecturerId", "name")
      .populate("examinerId", "name");

    req.app.get("io")?.emit("paperUpdated", updatedPaper);
    res.json({ message: "HOD approved paper", paper: updatedPaper });
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

// -----------------------------
// HOD: Pending Approvals
// -----------------------------

// Get papers pending HOD approval or approved
export const getPendingApprovals = async (req, res) => {
  try {
    // Optional: you can filter by department or HOD if needed
    const papers = await Paper.find({
      status: { $in: ["pending_approval", "approved"] },
    })
      .populate("lecturerId", "name") // assuming you have lecturerId ref
      .populate("examinerId", "name"); // assuming you have examinerId ref

    // Transform data to match frontend interface
    const formatted = papers.map(p => ({
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

    res.status(200).json(formatted);
  } catch (err) {
    console.error("Error in getPendingApprovals:", err);
    res.status(500).json({ message: "Server error fetching papers" });
  }
};

// -----------------------------
// Moderated Papers (approved + rejected)
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
// Approved Papers (HOD / Public)
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


// -----------------------------
// Lecturer: Revise Paper (Corrected)
// -----------------------------
export const revisePaper = async (req, res) => {
  try {
    const paper = await Paper.findById(req.params.id);
    if (!paper) return res.status(404).json({ message: "Paper not found" });

    // Authorization check
    if (paper.lecturerId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized to revise this paper" });
    }

    // Only allow revision if it was a draft or revision was requested
    if (!["draft", "revision_required"].includes(paper.status)) {
      return res.status(400).json({ message: "This paper does not require revision" });
    }

    // Handle File Replacement
    if (req.file) {
      // Delete the old file from storage if it exists
      if (paper.pdfUrl) {
        // Clean the path to get the absolute system path
        const oldFilePath = process.cwd() + paper.pdfUrl;
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }
      }

      // Format the new URL path (matching your createPaper logic)
      paper.pdfUrl = req.file.path
        .replace(process.cwd().replace(/\\/g, "/"), "")
        .replace(/\\/g, "/");
    }

    // Update the status based on user action (sent via req.body.status)
    // Usually "pending_moderation" or "draft"
    paper.status = req.body.status || "pending_moderation";

    const updatedPaper = await paper.save();

    // Notify other users via socket
    req.app.get("io")?.emit("paperUpdated", updatedPaper);

    res.json(updatedPaper);
  } catch (err) {
    console.error("Revision Error:", err);
    res.status(400).json({ message: err.message });
  }
};
