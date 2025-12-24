import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  title: String,
  message: String,
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Notification", notificationSchema);
