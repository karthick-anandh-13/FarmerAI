// backend/routes/followRoutes.js
const express = require("express");
const User = require("../models/User");
const Post = require("../models/Post");
const auth = require("../middleware/auth");

const router = express.Router();

/**
 * POST /api/users/:id/follow
 * Follow target user (auth)
 */
router.post("/users/:id/follow", auth, async (req, res) => {
  try {
    const targetId = req.params.id;
    const meId = req.user._id.toString();

    if (meId === targetId) return res.status(400).json({ success: false, message: "Cannot follow yourself" });

    const [me, target] = await Promise.all([User.findById(meId), User.findById(targetId)]);
    if (!target) return res.status(404).json({ success: false, message: "Target user not found" });

    // already following?
    if (me.following.some((u) => u.toString() === targetId)) {
      return res.status(400).json({ success: false, message: "Already following" });
    }

    me.following.push(target._id);
    target.followers.push(me._id);

    await Promise.all([me.save(), target.save()]);

    return res.json({ success: true, message: "Now following user", followingCount: me.following.length });
  } catch (err) {
    console.error("Follow error:", err);
    return res.status(500).json({ success: false, message: err.message || "Server error" });
  }
});

/**
 * POST /api/users/:id/unfollow
 * Unfollow target user (auth)
 */
router.post("/users/:id/unfollow", auth, async (req, res) => {
  try {
    const targetId = req.params.id;
    const meId = req.user._id.toString();

    if (meId === targetId) return res.status(400).json({ success: false, message: "Cannot unfollow yourself" });

    const [me, target] = await Promise.all([User.findById(meId), User.findById(targetId)]);
    if (!target) return res.status(404).json({ success: false, message: "Target user not found" });

    const before = me.following.length;
    me.following = me.following.filter((u) => u.toString() !== targetId);
    target.followers = target.followers.filter((u) => u.toString() !== meId);

    if (me.following.length === before) {
      return res.status(400).json({ success: false, message: "You are not following this user" });
    }

    await Promise.all([me.save(), target.save()]);

    return res.json({ success: true, message: "Unfollowed", followingCount: me.following.length });
  } catch (err) {
    console.error("Unfollow error:", err);
    return res.status(500).json({ success: false, message: err.message || "Server error" });
  }
});

/**
 * GET /api/users/:id/followers
 * List followers for user
 */
router.get("/users/:id/followers", async (req, res) => {
  try {
    const u = await User.findById(req.params.id).populate("followers", "name email avatar");
    if (!u) return res.status(404).json({ success: false, message: "User not found" });
    return res.json({ success: true, followers: u.followers });
  } catch (err) {
    console.error("Followers error:", err);
    return res.status(500).json({ success: false, message: err.message || "Server error" });
  }
});

/**
 * GET /api/users/:id/following
 * List who the user is following
 */
router.get("/users/:id/following", async (req, res) => {
  try {
    const u = await User.findById(req.params.id).populate("following", "name email avatar");
    if (!u) return res.status(404).json({ success: false, message: "User not found" });
    return res.json({ success: true, following: u.following });
  } catch (err) {
    console.error("Following error:", err);
    return res.status(500).json({ success: false, message: err.message || "Server error" });
  }
});

/**
 * GET /api/feed
 * Get recent posts by users the authenticated user follows.
 * Query params: page (default 1), limit (default 20)
 */
router.get("/feed", auth, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || "1", 10));
    const limit = Math.min(50, Math.max(5, parseInt(req.query.limit || "20", 10)));
    const skip = (page - 1) * limit;

    // get list of user ids the requester follows
    const me = await User.findById(req.user._id).select("following");
    const followingIds = (me.following || []).map((id) => id.toString());

    // include own posts as well (optional) — include meId
    followingIds.push(req.user._id.toString());

    // fetch posts
    const posts = await Post.find({ user: { $in: followingIds } })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("user", "name email avatar")
      .populate({ path: "comments", populate: { path: "user", select: "name email" } });

    return res.json({ success: true, page, limit, posts });
  } catch (err) {
    console.error("Feed error:", err);
    return res.status(500).json({ success: false, message: err.message || "Server error" });
  }
});

module.exports = router;
