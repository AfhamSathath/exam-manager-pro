import express from "express";
import {
  createSuggestion,
  getSuggestionsByPaper,
  replyToSuggestion,
  deleteSuggestion,
  getUnreadSuggestionCount,
} from "../controllers/suggestionController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// Create a new suggestion
router.post("/", protect, createSuggestion);

// Get all suggestions for a specific paper
router.get("/:paperId", protect, getSuggestionsByPaper);

// Reply to a suggestion
router.put("/reply/:id", protect, replyToSuggestion);

// Delete a suggestion
router.delete("/:id", protect, deleteSuggestion);

// Get unread suggestions count
router.get("/unread/count", protect, getUnreadSuggestionCount);

export default router;
