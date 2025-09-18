// E:\FarmerAI\src\index.js
require("dotenv").config(); // load env first

const path = require("path");
const fs = require("fs");
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const http = require("http");
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");

// Import routes & middleware from backend folder
const authRoutes = require("../backend/routes/authRoutes");
const userRoutes = require("../backend/routes/userRoutes"); // user profile routes
const postRoutes = require("../backend/routes/postRoutes");
const chatRoutes = require("../backend/routes/chatRoutes");
const notificationRoutes = require("../backend/routes/notificationRoutes");
const groupRoutes = require("../backend/routes/groupRoutes");
const followRoutes = require("../backend/routes/followRoutes"); // follow & feed
const authMiddleware = require("../backend/middleware/auth");

const app = express();
const server = http.createServer(app); // Wrap express in http server
const io = new Server(server, {
  cors: {
    origin: "*", // allow all origins (fine for dev)
    methods: ["GET", "POST"],
  },
});

// --- Ensure uploads directory exists ---
const uploadsDir = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// --- Middleware ---
app.use(cors());

// request logger for dev
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} › ${req.method} ${req.originalUrl}`);
  next();
});

// body parsers (multer handles multipart in routes that use it)
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// serve uploads directory (static files)
app.use("/uploads", express.static(uploadsDir));

// --- Config ---
const PORT = process.env.PORT || 5000;
const MONGO_URI =
  process.env.MONGO_URI || "mongodb://127.0.0.1:27017/farmerai";

// --- MongoDB connection with retry ---
async function connectWithRetry(retries = 10, interval = 2000) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`🔌 Attempting MongoDB connect (#${attempt})...`);
      await mongoose.connect(MONGO_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      console.log("✅ MongoDB connected");
      return;
    } catch (err) {
      console.error(`❌ MongoDB connection error: ${err?.message || err}`);
      if (attempt === retries) {
        console.error(
          "❌ Could not connect to MongoDB after retries. Exiting process."
        );
        process.exit(1);
      }
      console.log(`⏳ Retrying in ${interval / 1000}s...`);
      await new Promise((res) => setTimeout(res, interval));
    }
  }
}
connectWithRetry();

// --- Socket.IO auth middleware ---
io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error("No token provided"));
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret123");
    socket.user = decoded; // attach user to socket
    next();
  } catch (err) {
    next(new Error("Invalid token"));
  }
});

// --- Socket.IO events ---
io.on("connection", (socket) => {
  console.log(`🔌 User connected: ${socket.user.id}`);

  // private message
  socket.on("private_message", ({ to, content }) => {
    io.to(to).emit("private_message", {
      from: socket.user.id,
      content,
      timestamp: new Date(),
    });
  });

  // join group
  socket.on("join_group", (groupId) => {
    socket.join(groupId);
    console.log(`📢 User ${socket.user.id} joined group ${groupId}`);
  });

  // group message
  socket.on("group_message", ({ groupId, content }) => {
    io.to(groupId).emit("group_message", {
      from: socket.user.id,
      groupId,
      content,
      timestamp: new Date(),
    });
  });

  socket.on("disconnect", () => {
    console.log(`❌ User disconnected: ${socket.user.id}`);
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

// mount api routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/groups", groupRoutes);
app.use("/api", followRoutes);

// protected test endpoint
app.get("/api/protected", authMiddleware, (req, res) => {
  res.json({
    success: true,
    message: "You accessed a protected route",
    user: req.user,
  });
});

// 404 handler
app.use((req, res, next) => {
  if (req.path.startsWith("/api/")) {
    return res
      .status(404)
      .json({ success: false, message: "API route not found" });
  }
  next();
});

// error handler
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err && err.stack ? err.stack : err);
  if (err && err.message && err.message.includes("Only image files")) {
    return res.status(400).json({ success: false, message: err.message });
  }
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal server error",
  });
});

// --- Start server ---
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
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
