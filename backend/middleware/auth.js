// backend/middleware/auth.js
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const auth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || req.headers.Authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallbacksecret");

    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid token (user not found)" });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error("Auth middleware error:", err.message || err);
    return res.status(401).json({ success: false, message: "Token invalid or expired" });
  }
};

module.exports = auth;
