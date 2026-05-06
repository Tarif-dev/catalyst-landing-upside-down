/**
 * Server-only Gmail SMTP transport using Nodemailer.
 * Uses a Google App Password for authentication.
 *
 * Required env vars:
 *   GMAIL_USER          – the Gmail address (e.g. catalyst.auk@gmail.com)
 *   GMAIL_APP_PASSWORD  – 16-char App Password from Google Account
 */
import nodemailer from "nodemailer";

const GMAIL_USER = () => process.env.GMAIL_USER || "catalyst.auk@gmail.com";

const GMAIL_APP_PASSWORD = () => process.env.GMAIL_APP_PASSWORD || "";

let _transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (_transporter) return _transporter;

  const password = GMAIL_APP_PASSWORD();
  if (!password) {
    throw new Error(
      "GMAIL_APP_PASSWORD is not set. Generate one at https://myaccount.google.com/apppasswords",
    );
  }

  _transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: GMAIL_USER(),
      pass: password,
    },
  });

  return _transporter;
}

export interface SendMailOptions {
  to: string;
  subject: string;
  html: string;
}

/**
 * Send an email from catalyst.auk@gmail.com via Gmail SMTP.
 * Throws on failure.
 */
export async function sendMail({ to, subject, html }: SendMailOptions) {
  const transporter = getTransporter();

  const result = await transporter.sendMail({
    from: `"Catalyst 2K26" <${GMAIL_USER()}>`,
    to,
    subject,
    html,
  });

  console.log(
    `[Gmail] Sent "${subject}" to ${to} — messageId: ${result.messageId}`,
  );
  return result;
}
