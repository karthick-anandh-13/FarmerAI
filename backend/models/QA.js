// backend/models/QA.js
const mongoose = require("mongoose");

const qaSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      required: true,
      trim: true,
    },
    answer: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true }
);

// ✅ Add full-text search index (works for flexible matching)
qaSchema.index({ question: "text", answer: "text" });

module.exports = mongoose.model("QA", qaSchema);
