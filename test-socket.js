// E:\FarmerAI\test-socket.js
const { io } = require("socket.io-client");

// ✅ Your real JWT from previous prompts
const token =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4Y2MxNGFjZTRhMDBiOGUwYjU4MDJlMSIsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNzU4MjA1MTAwLCJleHAiOjE3NTg4MDk5MDB9.KqdMAL1K8eToSjslvchD7dlllcFf2W78Nux2Slm_cYo";

// Connect to backend
const socket = io("http://localhost:5000", {
  transports: ["websocket"], // force WebSocket (avoid xhr-polling issues)
  auth: { token },           // pass JWT for authentication
});

// ✅ Connected
socket.on("connect", () => {
  console.log("✅ Connected to server with id:", socket.id);

  // Send a test private message
  socket.emit("private_message", {
    to: "68cc14ace4a00b8e0b5802e1", // 🔹 replace with another valid userId from your DB
    content: "Hello from test client!",
  });
});

// 📩 Listen for private messages
socket.on("private_message", (msg) => {
  console.log("📩 New private message:", msg);
});

// ❌ Connection errors
socket.on("connect_error", (err) => {
  console.error("❌ Connection failed:", err.message);
});
