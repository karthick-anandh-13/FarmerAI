// backend/routes/qaRoutes.js
const express = require("express");
const QA = require("../models/QA");

const router = express.Router();

// Add a new Q&A entry
router.post("/", async (req, res) => {
  try {
    const { question, answer } = req.body;
    if (!question || !answer) {
      return res
        .status(400)
        .json({ success: false, message: "Question and answer are required" });
    }

    const qa = await QA.create({ question, answer });
    res.status(201).json({ success: true, qa });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Query Q&A entries using MongoDB text search
router.post("/query", async (req, res) => {
  try {
    const { question } = req.body;
    if (!question) {
      return res
        .status(400)
        .json({ success: false, message: "Question is required" });
    }

    // 🔍 Full-text search on "question" and "answer"
    const matches = await QA.find(
      { $text: { $search: question } },
      { score: { $meta: "textScore" } }
    ).sort({ score: { $meta: "textScore" } });

    res.json({
      success: true,
      question,
      answer: matches.length > 0 ? matches[0].answer : null,
      matches,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
