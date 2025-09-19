// E:\FarmerAI\src\index.js
require("dotenv").config();

const path = require("path");
const fs = require("fs");
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const http = require("http");
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");

// --- Import routes ---
const authRoutes = require("../backend/routes/authRoutes");
const userRoutes = require("../backend/routes/userRoutes");
const postRoutes = require("../backend/routes/postRoutes");
const chatRoutes = require("../backend/routes/chatRoutes");
const notificationRoutes = require("../backend/routes/notificationRoutes");
const groupRoutes = require("../backend/routes/groupRoutes");
const followRoutes = require("../backend/routes/followRoutes");
const qaRoutes = require("../backend/routes/qaRoutes"); // FAQ/QA routes
const authMiddleware = require("../backend/middleware/auth");

const app = express();
const server = http.createServer(app);

// --- Socket.IO ---
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});

// --- Ensure uploads directory exists ---
const uploadsDir = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// --- Middleware ---
app.use(cors());
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} › ${req.method} ${req.originalUrl}`);
  next();
});
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use("/uploads", express.static(uploadsDir));

// --- Config ---
const PORT = Number(process.env.PORT) || 5000;
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/farmerai";
const JWT_SECRET = process.env.JWT_SECRET || "secret123";

// --- MongoDB connection ---
async function connectWithRetry(retries = 10, interval = 2000) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`🔌 Attempting MongoDB connect (#${attempt})...`);
      await mongoose.connect(MONGO_URI);
      console.log("✅ MongoDB connected");
      return;
    } catch (err) {
      console.error(`❌ MongoDB error: ${err?.message || err}`);
      if (attempt === retries) {
        console.error("❌ Could not connect to MongoDB after retries. Exiting process.");
        process.exit(1);
      }
      console.log(`⏳ Retrying in ${interval / 1000}s...`);
      await new Promise((res) => setTimeout(res, interval));
    }
  }
}
connectWithRetry().catch((e) => {
  console.error("Fatal Mongo connection error:", e);
  process.exit(1);
});

// --- Socket.IO auth middleware ---
io.use((socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error("No token provided"));
    const decoded = jwt.verify(token, JWT_SECRET);
    // ensure decoded has id
    if (!decoded || !decoded.id) return next(new Error("Invalid token payload"));
    socket.user = decoded;
    return next();
  } catch (err) {
    return next(new Error("Invalid token"));
  }
});

// --- Socket.IO events ---
io.on("connection", (socket) => {
  const userId = socket.user?.id || socket.user?._id;
  console.log(`🔌 User connected: ${userId || "(unknown id)"}`);

  // join a private room for direct messages (use string id)
  if (userId) socket.join(String(userId));

  // private message
  socket.on("private_message", ({ to, content }) => {
    if (!to || !content) return;
    io.to(String(to)).emit("private_message", {
      from: String(userId),
      content,
      timestamp: new Date().toISOString(),
    });
  });

  // join group
  socket.on("join_group", (groupId) => {
    if (!groupId) return;
    socket.join(String(groupId));
    console.log(`📢 User ${userId} joined group ${groupId}`);
  });

  // group message
  socket.on("group_message", ({ groupId, content }) => {
    if (!groupId || !content) return;
    io.to(String(groupId)).emit("group_message", {
      from: String(userId),
      groupId: String(groupId),
      content,
      timestamp: new Date().toISOString(),
    });
  });

  socket.on("disconnect", (reason) => {
    console.log(`❌ User disconnected: ${userId || "(unknown)"} — ${reason || "socket closed"}`);
  });
});

// --- Routes ---
app.get("/api/health", (req, res) => {
  const states = ["disconnected", "connected", "connecting", "disconnecting"];
  res.json({
    status: "ok",
    message: "Backend server running",
    mongodb: states[mongoose.connection.readyState] || "unknown",
  });
});

// mount API routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/groups", groupRoutes);
app.use("/api", followRoutes);
app.use("/api/qa", qaRoutes);

// protected test endpoint
app.get("/api/protected", authMiddleware, (req, res) => {
  res.json({ success: true, message: "You accessed a protected route", user: req.user });
});

// 404 handler for unknown API routes
app.use((req, res, next) => {
  if (req.path.startsWith("/api/")) {
    return res.status(404).json({ success: false, message: "API route not found" });
  }
  next();
});

// centralized error handler
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err?.stack || err);
  if (err && err.message && err.message.includes("Only image files")) {
    return res.status(400).json({ success: false, message: err.message });
  }
  res.status(err.status || 500).json({ success: false, message: err.message || "Internal error" });
});

// --- Start server ---
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`    Socket.IO ready`);
});

// --- Graceful shutdown ---
function gracefulShutdown() {
  console.log("🛑 Graceful shutdown initiated");
  server.close(() => {
    console.log("HTTP server closed");
    mongoose.connection.close(false, () => {
      console.log("Mongo connection closed");
      process.exit(0);
    });
  });
}
process.on("SIGINT", gracefulShutdown);
process.on("SIGTERM", gracefulShutdown);
