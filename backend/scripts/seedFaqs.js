// backend/scripts/seedFaqs.js
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: path.resolve(process.cwd(), ".env") });

const FAQ = require("../models/FAQ");

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/farmerai";

async function run() {
  await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  const dataPath = path.join(__dirname, "..", "data", "faqs.json");
  const raw = fs.readFileSync(dataPath, "utf8");
  const items = JSON.parse(raw);

  // optional: clear existing
  // await FAQ.deleteMany({});
  for (const it of items) {
    // upsert by question
    await FAQ.updateOne({ question: it.question }, { $set: it }, { upsert: true });
    console.log("Upserted:", it.question);
  }
  console.log("Seeding complete");
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
