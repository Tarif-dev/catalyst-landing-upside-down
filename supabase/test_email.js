/**
 * Quick smoke-test: sends a test email via Gmail SMTP.
 * Run with: node --env-file=.env supabase/test_email.js
 */

import nodemailer from "nodemailer";

const user = process.env.GMAIL_USER || "catalyst.auk@gmail.com";
const pass = process.env.GMAIL_APP_PASSWORD;

if (!pass) {
  console.error(
    "❌ GMAIL_APP_PASSWORD is empty. Please set it in .env and save the file.",
  );
  process.exit(1);
}

console.log(`📧 Testing Gmail SMTP as ${user}…`);

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: { user, pass },
});

try {
  const info = await transporter.sendMail({
    from: `"Catalyst 2K26 Test" <${user}>`,
    to: user, // send to self for testing
    subject: "🧪 Catalyst Email Test — Ignore This",
    html: `<div style="background:#000;color:#f0e6e6;font-family:Georgia,serif;padding:40px;text-align:center;border:1px solid #331111">
      <p style="font-family:monospace;font-size:10px;text-transform:uppercase;letter-spacing:0.4em;color:#aa2222">Hawkins Lab — System Check</p>
      <h1 style="font-size:28px;font-style:italic;color:#f0e6e6">Gmail SMTP is <span style="color:#cc2222;text-shadow:0 0 10px rgba(200,30,30,0.6)">Working.</span></h1>
      <p style="color:#999;font-size:14px;margin-top:20px">If you received this email, the Nodemailer + Gmail App Password setup is correct.</p>
      <p style="font-family:monospace;font-size:10px;color:#666;margin-top:30px;text-transform:uppercase;letter-spacing:0.2em">
        Transmission Terminated.<br><span style="color:#cc2222">✦</span> Amity University Kolkata <span style="color:#cc2222">✦</span>
      </p>
    </div>`,
  });

  console.log(`✅ Test email sent! Message ID: ${info.messageId}`);
  console.log(`   Check the inbox of ${user}`);
} catch (err) {
  console.error("❌ Failed to send:", err.message);
  process.exit(1);
}
