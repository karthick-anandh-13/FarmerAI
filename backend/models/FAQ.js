// backend/models/FAQ.js
const mongoose = require("mongoose");

const faqSchema = new mongoose.Schema({
  question: { type: String, required: true, index: true },
  answer: { type: String, required: true },
  tags: [{ type: String }],           // optional: categories/language tags
  lang: { type: String, default: "multi" }, // optional language hint
  metadata: { type: Object, default: {} }   // store source, createdBy etc.
}, { timestamps: true });

module.exports = mongoose.model("FAQ", faqSchema);
