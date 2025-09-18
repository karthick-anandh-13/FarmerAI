// backend/models/GroupPost.js
const mongoose = require("mongoose");

const groupPostSchema = new mongoose.Schema(
  {
    group: { type: mongoose.Schema.Types.ObjectId, ref: "Group", required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: String, required: true, trim: true },
    image: { type: String, default: "" },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    comments: [{ type: mongoose.Schema.Types.ObjectId, ref: "Comment" }], // reuse Comment model
  },
  { timestamps: true }
);

module.exports = mongoose.model("GroupPost", groupPostSchema);
