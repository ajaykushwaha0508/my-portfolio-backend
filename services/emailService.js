const nodemailer = require("nodemailer");

// ── Create transporter ────────────────────────────────────────────────────────
function createTransporter() {
  // If SMTP_HOST is set, use it; otherwise default to Gmail
  if (process.env.SMTP_HOST) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_PORT === "465",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS, // Use an App Password — NOT your real password
    },
  });
}

// ── HTML email template ───────────────────────────────────────────────────────
function buildHtml({ id, name, email, subject, message, createdAt }) {
  const date = new Date(createdAt).toLocaleString("en-IN", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  });

  return `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8"/>
<style>
  body{margin:0;padding:0;background:#0a0e1a;font-family:'Segoe UI',Arial,sans-serif}
  .wrap{max-width:580px;margin:32px auto;background:#0f1524;border:1px solid rgba(0,212,255,.18);border-radius:16px;overflow:hidden}
  .header{background:linear-gradient(135deg,#0a1628 0%,#0f1f3d 100%);padding:36px 36px 28px;border-bottom:1px solid rgba(0,212,255,.15)}
  .logo{font-size:1.1rem;font-weight:700;color:#f0f4ff;letter-spacing:-.3px}
  .logo span{color:#00d4ff}
  .badge{display:inline-block;background:rgba(0,212,255,.12);border:1px solid rgba(0,212,255,.25);color:#00d4ff;font-size:.72rem;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;padding:4px 12px;border-radius:50px;margin-top:14px}
  .title{font-size:1.5rem;font-weight:700;color:#f0f4ff;margin:12px 0 0}
  .body{padding:32px 36px}
  .field{margin-bottom:22px}
  .label{font-size:.72rem;font-weight:600;color:#4a5568;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px}
  .value{font-size:.95rem;color:#f0f4ff;background:#131929;border:1px solid rgba(255,255,255,.07);border-radius:8px;padding:12px 16px;word-break:break-word;line-height:1.6}
  .value a{color:#00d4ff;text-decoration:none}
  .msg-box{font-size:.93rem;color:#c8d4e8;background:#131929;border:1px solid rgba(255,255,255,.07);border-left:3px solid #00d4ff;border-radius:8px;padding:16px;line-height:1.75;white-space:pre-wrap}
  .meta{margin-top:28px;padding-top:20px;border-top:1px solid rgba(255,255,255,.06);display:flex;gap:12px;flex-wrap:wrap}
  .chip{font-size:.75rem;color:#8892a4;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07);border-radius:6px;padding:4px 10px}
  .footer{background:#080c18;padding:18px 36px;text-align:center;font-size:.78rem;color:#4a5568}
</style>
</head>
<body>
<div class="wrap">
  <div class="header">
    <div class="logo"><span>&lt;</span>DevPortfolio<span>/&gt;</span></div>
    <div class="badge">New Contact Submission</div>
    <div class="title">You've got a new message!</div>
  </div>
  <div class="body">
    <div class="field">
      <div class="label">From</div>
      <div class="value">${escHtml(name)}</div>
    </div>
    <div class="field">
      <div class="label">Email</div>
      <div class="value"><a href="mailto:${escHtml(email)}">${escHtml(email)}</a></div>
    </div>
    <div class="field">
      <div class="label">Subject</div>
      <div class="value">${escHtml(subject)}</div>
    </div>
    <div class="field">
      <div class="label">Message</div>
      <div class="msg-box">${escHtml(message)}</div>
    </div>
    <div class="meta">
      <span class="chip">ID: ${id}</span>
      <span class="chip">📅 ${date}</span>
    </div>
  </div>
  <div class="footer">This email was sent automatically by your portfolio contact form.</div>
</div>
</body>
</html>`;
}

function escHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ── Main export ───────────────────────────────────────────────────────────────
async function sendContactEmail(submission) {
  if (!process.env.EMAIL_USER && !process.env.SMTP_HOST) {
    console.warn("⚠  No email credentials set — skipping email send.");
    return;
  }

  const transporter = createTransporter();

  const mailOptions = {
    from: `"DevPortfolio Contact" <${process.env.EMAIL_USER || process.env.SMTP_USER}>`,
    to: process.env.RECEIVER_EMAIL || process.env.EMAIL_USER,
    replyTo: submission.email,
    subject: `[Portfolio] ${submission.subject}`,
    text: [
      `New contact form submission`,
      `──────────────────────────`,
      `Name:    ${submission.name}`,
      `Email:   ${submission.email}`,
      `Subject: ${submission.subject}`,
      ``,
      `Message:`,
      submission.message,
      ``,
      `──────────────────────────`,
      `Submission ID: ${submission.id}`,
      `Date: ${new Date(submission.createdAt).toLocaleString()}`,
    ].join("\n"),
    html: buildHtml(submission),
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (err) {
    console.error("❌ Failed to send email:", err);
    throw err;
  }
}

module.exports = { sendContactEmail };
