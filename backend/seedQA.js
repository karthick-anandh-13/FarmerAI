const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const QA = require("./models/QA");

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/farmerai";

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ MongoDB connected");

    const filePath = path.join(__dirname, "data", "qaSeed.json");
    const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));

    await QA.deleteMany({});
    await QA.insertMany(data);

    console.log(`🌱 Seeded ${data.length} Q&A entries`);
    process.exit();
  } catch (err) {
    console.error("❌ Error seeding:", err.message);
    process.exit(1);
  }
}

seed();
