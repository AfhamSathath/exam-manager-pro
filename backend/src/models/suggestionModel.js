// backend/models/suggestionModel.js
import mongoose from "mongoose";

const suggestionSchema = new mongoose.Schema(
  {
    paper: { type: mongoose.Schema.Types.ObjectId, ref: "Paper", required: true },
    examiner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, required: true },
    reply: { type: String, default: null },
    status: { type: String, enum: ["unread", "replied"], default: "unread" },
  },
  { timestamps: true }
);

export default mongoose.model("Suggestion", suggestionSchema);
