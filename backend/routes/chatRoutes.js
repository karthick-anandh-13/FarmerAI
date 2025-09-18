const express = require("express");
const Chat = require("../models/Chat");
const Message = require("../models/Message");
const User = require("../models/User"); // ✅ use Mongoose User model
const auth = require("../middleware/auth");

const router = express.Router();

/**
 * @route   POST /api/chat/direct/:userId
 * @desc    Start or get a direct chat between two users
 */
router.post("/direct/:userId", auth, async (req, res) => {
  try {
    const userId = req.params.userId;

    let chat = await Chat.findOne({
      isGroup: false,
      participants: { $all: [req.user._id, userId] },
    }).populate("participants", "name email");

    if (!chat) {
      chat = await Chat.create({
        isGroup: false,
        participants: [req.user._id, userId],
      });
      await chat.populate("participants", "name email");
    }

    res.json({ success: true, chat });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * @route   POST /api/chat/group
 * @desc    Create a group chat
 */
router.post("/group", auth, async (req, res) => {
  try {
    const { name, participants } = req.body;
    if (!name || !participants || participants.length < 2) {
      return res.status(400).json({
        success: false,
        message: "Group name and at least 2 participants are required",
      });
    }

    const chat = await Chat.create({
      name,
      isGroup: true,
      participants: [...participants, req.user._id],
      groupAdmin: req.user._id,
    });

    await chat.populate("participants", "name email");

    res.status(201).json({ success: true, chat });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * @route   POST /api/chat/:chatId/message
 * @desc    Send a message
 */
router.post("/:chatId/message", auth, async (req, res) => {
  try {
    const { chatId } = req.params;
    const { content, type } = req.body;

    if (!content) {
      return res.status(400).json({ success: false, message: "Message content is required" });
    }

    const message = await Message.create({
      chat: chatId,
      sender: req.user._id,
      content,
      type: type || "text",
    });

    // Update latestMessage in chat
    await Chat.findByIdAndUpdate(chatId, { latestMessage: message._id });

    await message.populate("sender", "name email");

    res.status(201).json({ success: true, message });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * @route   GET /api/chat/:chatId/messages
 * @desc    Get all messages in a chat
 */
router.get("/:chatId/messages", auth, async (req, res) => {
  try {
    const messages = await Message.find({ chat: req.params.chatId })
      .populate("sender", "name email")
      .sort({ createdAt: 1 });

    res.json({ success: true, messages });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * @route   POST /api/chat/support
 * @desc    Start or get a support chat (user <-> admin/moderator)
 */
router.post("/support", auth, async (req, res) => {
  try {
    let chat = await Chat.findOne({
      isSupport: true,
      participants: req.user._id,
    }).populate("participants", "name email");

    if (!chat) {
      // ✅ Find first available admin or moderator using User model
      const admin = await User.findOne({ role: { $in: ["admin", "moderator"] } });

      if (!admin) {
        return res.status(400).json({
          success: false,
          message: "No support staff available right now",
        });
      }

      chat = await Chat.create({
        isSupport: true,
        participants: [req.user._id, admin._id],
      });
      await chat.populate("participants", "name email");
    }

    res.json({ success: true, chat });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
