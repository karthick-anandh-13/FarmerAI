// backend/routes/userRoutes.js
const express = require("express");
const User = require("../models/User");
const auth = require("../middleware/auth");
const upload = require("../middleware/upload");
const fs = require("fs");
const path = require("path");

const router = express.Router();

/**
 * GET /api/users/me
 * Return current authenticated user's profile
 */
router.get("/me", auth, async (req, res) => {
  try {
    const u = req.user;
    return res.json({
      success: true,
      user: {
        id: u._id,
        name: u.name,
        email: u.email,
        role: u.role,
        avatar: u.avatar || "",
        bio: u.bio || "",
        followers: u.followers?.length || 0,
        following: u.following?.length || 0,
        createdAt: u.createdAt,
        updatedAt: u.updatedAt,
      },
    });
  } catch (err) {
    console.error("GET /me error:", err);
    return res.status(500).json({ success: false, message: err.message || "Server error" });
  }
});

/**
 * PATCH /api/users/me
 * Update profile (name, bio) and optionally avatar (multipart form, field "avatar")
 */
router.patch("/me", auth, upload.single("avatar"), async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    // Update fields
    if (req.body.name && typeof req.body.name === "string") user.name = req.body.name.trim();
    if (req.body.bio && typeof req.body.bio === "string") user.bio = req.body.bio.trim();

    // Avatar upload handling
    if (req.file) {
      const old = user.avatar;
      user.avatar = `/uploads/${req.file.filename}`;

      // remove old avatar file (best-effort, only if stored in uploads)
      if (old && old.startsWith("/uploads/")) {
        try {
          const oldPath = path.join(__dirname, "..", old);
          if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
        } catch (e) {
          console.warn("Failed to remove old avatar:", e?.message || e);
        }
      }
    }

    await user.save();

    return res.json({
      success: true,
      message: "Profile updated",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar || "",
        bio: user.bio || "",
        updatedAt: user.updatedAt,
      },
    });
  } catch (err) {
    console.error("PATCH /me error:", err);
    return res.status(500).json({ success: false, message: err.message || "Server error" });
  }
});

/**
 * GET /api/users/:id
 * Public profile
 */
router.get("/:id", async (req, res) => {
  try {
    const u = await User.findById(req.params.id).select("name avatar bio createdAt");
    if (!u) return res.status(404).json({ success: false, message: "User not found" });

    return res.json({
      success: true,
      user: {
        id: u._id,
        name: u.name,
        avatar: u.avatar || "",
        bio: u.bio || "",
        createdAt: u.createdAt,
      },
    });
  } catch (err) {
    console.error("GET /:id profile error:", err);
    return res.status(500).json({ success: false, message: err.message || "Server error" });
  }
});

module.exports = router;
