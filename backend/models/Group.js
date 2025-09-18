// backend/models/Group.js
const mongoose = require("mongoose");

const groupSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, index: true },
    slug: { type: String, required: true, unique: true }, // url-friendly
    description: { type: String, default: "" },
    image: { type: String, default: "" }, // /uploads/...
    visibility: { type: String, enum: ["public", "private"], default: "public" },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    admins: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    joinRequests: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        message: { type: String, default: "" },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

// simple pre-save hook to ensure owner is in members
groupSchema.pre("save", function (next) {
  if (!this.members.some((m) => String(m) === String(this.owner))) {
    this.members.push(this.owner);
  }
  next();
});

module.exports = mongoose.model("Group", groupSchema);
