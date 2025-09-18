// backend/utils/email.js
const nodemailer = require("nodemailer");

async function sendEmail({ to, subject, text, html }) {
  // Use SMTP credentials from env if available
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  if (!smtpHost || !smtpUser || !smtpPass) {
    // No SMTP configured — in dev we'll return the message to caller instead of sending email.
    console.warn("SMTP not configured. Email will not be sent. Configure SMTP_* env vars to enable sending.");
    return { sent: false, info: "SMTP not configured" };
  }

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: parseInt(smtpPort || "587", 10),
    secure: parseInt(smtpPort || "587", 10) === 465, // true for 465
    auth: { user: smtpUser, pass: smtpPass },
  });

  const info = await transporter.sendMail({
    from: process.env.SMTP_FROM || smtpUser,
    to,
    subject,
    text,
    html,
  });

  return { sent: true, info };
}

module.exports = sendEmail;
