// backend/routes/postRoutes.js
const express = require("express");
const Post = require("../models/Post");
const Comment = require("../models/Comment");
const Notification = require("../models/Notification");
const auth = require("../middleware/auth");
const upload = require("../middleware/upload"); // multer middleware

const router = express.Router();

/**
 * @route   POST /api/posts
 * @desc    Create a new post (private, supports image upload)
 */
router.post("/", auth, upload.single("image"), async (req, res) => {
  try {
    const content = (req.body && typeof req.body.content === "string") ? req.body.content.trim() : "";
    if (!content) {
      return res.status(400).json({ success: false, message: "Content is required" });
    }

    const imagePath = req.file ? `/uploads/${req.file.filename}` : "";

    const post = await Post.create({
      user: req.user._id,
      content,
      image: imagePath,
    });

    return res.status(201).json({ success: true, message: "Post created", post });
  } catch (err) {
    console.error("Create post error:", err);
    return res.status(500).json({ success: false, message: err.message || "Server error" });
  }
});

/**
 * @route   POST /api/posts/:id/comment
 * @desc    Add comment to a post (private)
 */
router.post("/:id/comment", auth, async (req, res) => {
  try {
    const postId = req.params.id;
    const text = (req.body && typeof req.body.text === "string") ? req.body.text.trim() : "";

    if (!text) {
      return res.status(400).json({ success: false, message: "Comment text required" });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ success: false, message: "Post not found" });
    }

    const comment = await Comment.create({
      post: postId,
      user: req.user._id,
      text,
    });

    post.comments.push(comment._id);
    await post.save();

    await comment.populate("user", "name email");

    // Create notification for post owner (best-effort)
    if (post.user.toString() !== req.user._id.toString()) {
      try {
        await Notification.create({
          user: post.user,
          actor: req.user._id,
          type: "comment",
          post: post._id,
          comment: comment._id,
          data: { text: comment.text },
        });
      } catch (nerr) {
        console.error("Failed to create comment notification:", nerr?.message || nerr);
      }
    }

    return res.status(201).json({ success: true, message: "Comment added", comment });
  } catch (err) {
    console.error("Add comment error:", err);
    return res.status(500).json({ success: false, message: err.message || "Server error" });
  }
});

/**
 * @route   POST /api/posts/:id/like
 * @desc    Like a post (private)
 */
router.post("/:id/like", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: "Post not found" });

    const userIdStr = req.user._id.toString();
    if (post.likes.some((u) => u.toString() === userIdStr)) {
      return res.status(400).json({ success: false, message: "Already liked" });
    }

    post.likes.push(req.user._id);
    await post.save();

    // Create notification for post owner (best-effort)
    if (post.user.toString() !== userIdStr) {
      try {
        await Notification.create({
          user: post.user,
          actor: req.user._id,
          type: "like",
          post: post._id,
        });
      } catch (nerr) {
        console.error("Failed to create like notification:", nerr?.message || nerr);
      }
    }

    return res.json({ success: true, message: "Post liked", likesCount: post.likes.length });
  } catch (err) {
    console.error("Like post error:", err);
    return res.status(500).json({ success: false, message: err.message || "Server error" });
  }
});

/**
 * @route   POST /api/posts/:id/unlike
 * @desc    Unlike a post (private)
 */
router.post("/:id/unlike", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: "Post not found" });

    const userIdStr = req.user._id.toString();
    const before = post.likes.length;
    post.likes = post.likes.filter((u) => u.toString() !== userIdStr);

    if (post.likes.length === before) {
      return res.status(400).json({ success: false, message: "You haven't liked this post" });
    }

    await post.save();

    // Remove like notification (best-effort)
    try {
      await Notification.deleteMany({
        user: post.user,
        actor: req.user._id,
        type: "like",
        post: post._id,
      });
    } catch (nerr) {
      console.error("Failed to remove like notification:", nerr?.message || nerr);
    }

    return res.json({ success: true, message: "Post unliked", likesCount: post.likes.length });
  } catch (err) {
    console.error("Unlike post error:", err);
    return res.status(500).json({ success: false, message: err.message || "Server error" });
  }
});

/**
 * @route   PATCH /api/posts/:id
 * @desc    Update a post (private, owner only, supports new image upload)
 */
router.patch("/:id", auth, upload.single("image"), async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: "Post not found" });

    if (post.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    const newContent = (req.body && typeof req.body.content === "string") ? req.body.content.trim() : undefined;
    if (typeof newContent === "string" && newContent.length > 0) post.content = newContent;

    if (req.file) {
      post.image = `/uploads/${req.file.filename}`;
    }

    await post.save();

    return res.json({ success: true, message: "Post updated", post });
  } catch (err) {
    console.error("Update post error:", err);
    return res.status(500).json({ success: false, message: err.message || "Server error" });
  }
});

/**
 * @route   DELETE /api/posts/:id
 * @desc    Delete a post (private, owner only)
 */
router.delete("/:id", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: "Post not found" });

    if (post.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    // Cleanup notifications related to this post (best-effort)
    try {
      await Notification.deleteMany({ post: post._id });
    } catch (nerr) {
      console.error("Notification cleanup error:", nerr?.message || nerr);
    }

    await post.deleteOne();
    return res.json({ success: true, message: "Post deleted" });
  } catch (err) {
    console.error("Delete post error:", err);
    return res.status(500).json({ success: false, message: err.message || "Server error" });
  }
});

/**
 * @route   GET /api/posts/:id
 * @desc    Get single post by ID (with comments & user populated)
 */
router.get("/:id", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate("user", "name email")
      .populate({
        path: "comments",
        populate: { path: "user", select: "name email" },
        options: { sort: { createdAt: -1 } },
      });

    if (!post) return res.status(404).json({ success: false, message: "Post not found" });

    return res.json({ success: true, post });
  } catch (err) {
    console.error("Get post error:", err);
    return res.status(500).json({ success: false, message: err.message || "Server error" });
  }
});

module.exports = router;
