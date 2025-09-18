// backend/models/Post.js
const mongoose = require("mongoose");

const postSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500, // limit length to avoid spam
    },
    image: {
      type: String, // URL or file path if you add uploads later
    },
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    comments: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Comment", // we'll create Comment model in Step 5.3
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Post", postSchema);
