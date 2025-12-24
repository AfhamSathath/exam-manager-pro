import Paper from "../models/paperModel.js";

/** Create a paper */
export const createPaper = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "File is required" });
    }

    const fileUrl = `${req.protocol}://${req.get("host")}/uploads/papers/${req.file.filename}`;

    const paper = await Paper.create({
      title: req.body.title,
      courseCode: req.body.courseCode,
      courseName: req.body.courseName,
      semester: req.body.semester,
      year: req.body.year,
      department: req.body.department,
      lecturer: req.body.lecturer,
      fileUrl,
    });

    res.status(201).json({ message: "Paper Uploaded", paper });
  } catch (error) {
    console.error("Create Paper Error:", error);
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};

/** Fetch all papers */
export const getPapers = async (req, res) => {
  try {
    const papers = await Paper.find().sort({ createdAt: -1 });
    res.json(papers);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch papers", error: error.message });
  }
};

/** Fetch single paper */
export const getPaperById = async (req, res) => {
  try {
    const paper = await Paper.findById(req.params.id);
    if (!paper) return res.status(404).json({ message: "Paper not found" });

    res.json(paper);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/** Update paper */
export const updatePaper = async (req, res) => {
  try {
    const updateData = { ...req.body };

    if (req.file) {
      updateData.fileUrl = `${req.protocol}://${req.get("host")}/uploads/papers/${req.file.filename}`;
    }

    const updated = await Paper.findByIdAndUpdate(req.params.id, updateData, { new: true });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: "Failed to update", error: error.message });
  }
};

/** Delete paper */
export const deletePaper = async (req, res) => {
  try {
    await Paper.findByIdAndDelete(req.params.id);
    res.json({ message: "Paper deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete", error: error.message });
  }
};
