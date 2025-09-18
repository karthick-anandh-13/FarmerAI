// backend/routes/notificationRoutes.js
const express = require("express");
const Notification = require("../models/Notification");
const auth = require("../middleware/auth");

const router = express.Router();

// GET /api/notifications - list user's notifications (most recent first)
router.get("/", auth, async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user._id })
      .populate("actor", "name email")
      .populate("post", "content")
      .populate("comment", "text")
      .sort({ createdAt: -1 })
      .limit(100);
    res.json({ success: true, notifications });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH /api/notifications/:id/read - mark single notification read
router.patch("/:id/read", auth, async (req, res) => {
  try {
    const notif = await Notification.findById(req.params.id);
    if (!notif) return res.status(404).json({ success: false, message: "Notification not found" });
    if (notif.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }
    notif.read = true;
    await notif.save();
    res.json({ success: true, message: "Marked read", notification: notif });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PATCH /api/notifications/mark-all-read - mark all unread notifications for user as read
router.patch("/mark-all-read", auth, async (req, res) => {
  try {
    await Notification.updateMany({ user: req.user._id, read: false }, { $set: { read: true } });
    res.json({ success: true, message: "All notifications marked read" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
