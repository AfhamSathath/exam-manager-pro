import express from "express";
import {
  createNotification,
  getAllNotifications,
  getUserNotifications,
  updateNotification,
  deleteNotification,
  markAllAsRead,
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "../controllers/notificationController.js";

const router = express.Router();

// CRUD routes
router.post("/", createNotification);
router.get("/", getAllNotifications);
router.get("/user/:userId", getUserNotifications);
router.put("/:id", updateNotification);
router.delete("/:id", deleteNotification);

// Mark all as read for a user
router.put("/user/:userId/read", markAllAsRead);
router.get("/", getNotifications); // GET /api/notifications?userId=...
router.patch("/:id/read", markNotificationRead); // PATCH /api/notifications/:id/read
router.patch("/:userId/read-all", markAllNotificationsRead); // PATCH /api/notifications/:userId/read-all

export default router;
