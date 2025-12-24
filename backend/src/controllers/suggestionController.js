import Suggestion from "../models/suggestionModel.js";
import Paper from "../models/paperModel.js";

// @desc    Create a new suggestion
// @route   POST /api/suggestions
// @access  Private (Examiner)
export const createSuggestion = async (req, res) => {
  try {
    const { paperId, text } = req.body;

    if (!paperId || !text) {
      return res.status(400).json({ message: "Paper ID and text are required" });
    }

    const paper = await Paper.findById(paperId);
    if (!paper) {
      return res.status(404).json({ message: "Paper not found" });
    }

    const suggestion = await Suggestion.create({
      paper: paperId,
      examiner: req.user._id,
      text,
    });

    res.status(201).json(suggestion);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get suggestions for a paper
// @route   GET /api/suggestions/:paperId
// @access  Private
export const getSuggestionsByPaper = async (req, res) => {
  try {
    const { paperId } = req.params;

    const suggestions = await Suggestion.find({ paper: paperId })
      .populate("examiner", "name email")
      .sort({ createdAt: -1 });

    res.json(suggestions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Reply to a suggestion
// @route   PUT /api/suggestions/reply/:id
// @access  Private (Lecturer/Admin)
export const replyToSuggestion = async (req, res) => {
  try {
    const { id } = req.params;
    const { reply } = req.body;

    const suggestion = await Suggestion.findById(id);
    if (!suggestion) {
      return res.status(404).json({ message: "Suggestion not found" });
    }

    suggestion.reply = reply;
    suggestion.status = "replied";
    await suggestion.save();

    res.json(suggestion);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a suggestion
// @route   DELETE /api/suggestions/:id
// @access  Private
export const deleteSuggestion = async (req, res) => {
  try {
    const { id } = req.params;

    const suggestion = await Suggestion.findById(id);
    if (!suggestion) {
      return res.status(404).json({ message: "Suggestion not found" });
    }

    await suggestion.remove();
    res.json({ message: "Suggestion deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all unread suggestions count (optional helper)
// @route   GET /api/suggestions/unread/count
// @access  Private
export const getUnreadSuggestionCount = async (req, res) => {
  try {
    const count = await Suggestion.countDocuments({ status: "unread" });
    res.json({ unreadCount: count });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
