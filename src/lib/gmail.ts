/**
 * Server-only Gmail SMTP transport using Nodemailer.
 * Uses a Google App Password for authentication.
 *
 * Required env vars:
 *   GMAIL_USER          – the Gmail address (e.g. catalyst.auk@gmail.com)
 *   GMAIL_APP_PASSWORD  – 16-char App Password from Google Account
 */
import nodemailer from "nodemailer";
import { existsSync } from "node:fs";
import { join } from "node:path";

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
  html?: string;
  text?: string;
  attachments?: nodemailer.SendMailOptions["attachments"];
  includeDefaultAttachments?: boolean;
}

const DEFAULT_ATTACHMENT_FILES = [
  {
    filename: "Catalyst Brochure.pdf",
    diskName: "catalyst-brochure.pdf",
  },
  {
    filename: "AI Hackathon Rulebook.pdf",
    diskName: "ai-hackathon-rulebook.pdf",
  },
];

function attachmentPath(diskName: string) {
  const candidates = [
    join(process.cwd(), "public", "attachments", diskName),
    join(process.cwd(), ".output", "public", "attachments", diskName),
  ];
  return candidates.find((candidate) => existsSync(candidate));
}

function emailAttachments(
  attachments?: nodemailer.SendMailOptions["attachments"],
  includeDefaultAttachments = true,
) {
  const bundledAttachments = includeDefaultAttachments
    ? DEFAULT_ATTACHMENT_FILES.flatMap((attachment) => {
        const path = attachmentPath(attachment.diskName);
        return path ? [{ filename: attachment.filename, path }] : [];
      })
    : [];
  return [...bundledAttachments, ...(attachments ?? [])];
}

/**
 * Send an email from catalyst.auk@gmail.com via Gmail SMTP.
 * Throws on failure.
 */
export async function sendMail({
  to,
  subject,
  html,
  text,
  attachments,
  includeDefaultAttachments,
}: SendMailOptions) {
  if (!html && !text) {
    throw new Error("Email body is empty.");
  }

  const transporter = getTransporter();

  const result = await transporter.sendMail({
    from: `"Catalyst 2K26" <${GMAIL_USER()}>`,
    to,
    subject,
    html,
    text,
    attachments: emailAttachments(attachments, includeDefaultAttachments),
  });

  console.log(
    `[Gmail] Sent "${subject}" to ${to} — messageId: ${result.messageId}`,
  );
  return result;
}
