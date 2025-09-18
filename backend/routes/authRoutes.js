// backend/routes/authRoutes.js
const express = require("express");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const User = require("../models/User");
const sendEmail = require("../utils/email");

const router = express.Router();

// POST /api/auth/signup
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body || {};
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: "Name, email and password are required" });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(400).json({ success: false, message: "Email already in use" });

    const user = await User.create({ name, email: email.toLowerCase(), password });
    const payload = { id: user._id, role: user.role };
    const token = jwt.sign(payload, process.env.JWT_SECRET || "supersecret", { expiresIn: "7d" });

    res.status(201).json({
      success: true,
      message: "Signup successful",
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ success: false, message: err.message || "Server error" });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ success: false, message: "Email and password required" });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(400).json({ success: false, message: "Invalid credentials" });

    const ok = await user.matchPassword(password);
    if (!ok) return res.status(400).json({ success: false, message: "Invalid credentials" });

    const payload = { id: user._id, role: user.role };
    const token = jwt.sign(payload, process.env.JWT_SECRET || "supersecret", { expiresIn: "7d" });

    res.json({ success: true, message: "Login successful", token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ success: false, message: err.message || "Server error" });
  }
});

/**
 * POST /api/auth/forgot-password
 * Body: { email }
 * Generates a one-time token and (attempts) to email it.
 * In dev (no SMTP), the reset token/link is returned in the response.
 */
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body || {};
    if (!email) return res.status(400).json({ success: false, message: "Email required" });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(200).json({ success: true, message: "If the email exists we'll send reset instructions" }); // avoid user enumeration

    // create token (random bytes), store hashed token and expiry (1 hour)
    const token = crypto.randomBytes(32).toString("hex");
    const hashed = crypto.createHash("sha256").update(token).digest("hex");
    user.resetPasswordToken = hashed;
    user.resetPasswordExpires = Date.now() + 60 * 60 * 1000; // 1 hour
    await user.save();

    const resetUrl = `${process.env.FRONTEND_URL || "http://localhost:3000"}/reset-password?token=${token}&email=${encodeURIComponent(user.email)}`;
    const text = `You requested a password reset. Use the link below to reset your password. Link valid for 1 hour:\n\n${resetUrl}`;

    // Try sending email
    const emailResult = await sendEmail({ to: user.email, subject: "Password reset", text, html: `<p>${text.replace(/\n/g,'<br/>')}</p>` });

    // If SMTP not configured, return reset link in response (dev convenience)
    if (emailResult && emailResult.sent === false) {
      return res.json({ success: true, message: "Reset link (dev)", resetUrl });
    }

    return res.json({ success: true, message: "If the email exists we'll send reset instructions" });
  } catch (err) {
    console.error("forgot-password error:", err);
    return res.status(500).json({ success: false, message: err.message || "Server error" });
  }
});

/**
 * POST /api/auth/reset-password
 * Body: { token, email, password }
 */
router.post("/reset-password", async (req, res) => {
  try {
    const { token, email, password } = req.body || {};
    if (!token || !email || !password) return res.status(400).json({ success: false, message: "token, email and password required" });
    if (password.length < 6) return res.status(400).json({ success: false, message: "Password must be at least 6 characters" });

    const hashed = crypto.createHash("sha256").update(token).digest("hex");
    const user = await User.findOne({
      email: email.toLowerCase(),
      resetPasswordToken: hashed,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) return res.status(400).json({ success: false, message: "Invalid or expired reset token" });

    // Set new password and clear token fields
    user.password = password;
    user.resetPasswordToken = "";
    user.resetPasswordExpires = undefined;
    await user.save();

    // Optionally auto-login: generate JWT
    const payload = { id: user._id, role: user.role };
    const jwtToken = jwt.sign(payload, process.env.JWT_SECRET || "supersecret", { expiresIn: "7d" });

    return res.json({ success: true, message: "Password reset successful", token: jwtToken });
  } catch (err) {
    console.error("reset-password error:", err);
    return res.status(500).json({ success: false, message: err.message || "Server error" });
  }
});

module.exports = router;
