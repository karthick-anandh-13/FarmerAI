const mongoose = require("mongoose");

const chatSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true }, // for group chats
    isGroup: { type: Boolean, default: false },
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    latestMessage: { type: mongoose.Schema.Types.ObjectId, ref: "Message" },
    groupAdmin: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // only for groups
    isSupport: { type: Boolean, default: false }, // true = support chat
  },
  { timestamps: true }
);

module.exports = mongoose.model("Chat", chatSchema);
