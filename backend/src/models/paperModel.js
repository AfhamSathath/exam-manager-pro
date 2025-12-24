// backend/src/models/paperModel.js
import mongoose from "mongoose";

const paperSchema = new mongoose.Schema(
  {
    year: {
      type: String,
      required: [true, "Please select the academic year"],
      enum: ["1st Year", "2nd Year", "3rd Year"],
    },
    semester: {
      type: String,
      required: [true, "Please select the semester"],
      enum: ["1st Semester", "2nd Semester"],
    },
    courseName: {
      type: String,
      required: [true, "Please select the course name"],
    },
    paperType: {
      type: String,
      required: [true, "Please select the paper type"],
      enum: ["exam", "assessment"],
    },
    pdfUrl: {
      type: String,
      required: [true, "PDF file is required"],
    },
    status: {
      type: String,
      default: "draft",
      enum: [
        "draft",                 // Lecturer sets paper
        "pending_moderation",     // Submitted to examiner
        "revision_required",      // Examiner requests changes
        "pending_approval",       // Examiner approved, waiting HOD
        "approved",               // HOD approved
        "printed",                // Paper sent to print
      ],
    },
    
    examinerComment: {
      type: String,
      default: "",
    },
    examinerReviewedAt: {
      type: Date,
    },
    moderationComments: {
      type: [
        {
          commentByName: String, // Examiner name
          comment: String,
          createdAt: { type: Date, default: Date.now },
        },
      ],
      default: [],
    },
  },
  { timestamps: true }
);

const Paper = mongoose.model("Paper", paperSchema);

export default Paper;
