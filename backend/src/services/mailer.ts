import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Shared mailer.
 *
 * - If BREVO_API_KEY is set → send via Brevo HTTP API (HTTPS/443).
 *   Required on hosts that block outbound SMTP ports (e.g. Render Free tier).
 * - Otherwise → fall back to Gmail SMTP via nodemailer (works locally).
 */

export interface MailOptions {
  from?: string; // e.g. `"H&M Phone Store" <abc@gmail.com>`
  to: string;
  subject: string;
  html: string;
}

const DEFAULT_SENDER_NAME = 'H&M Phone Store';

const getSenderEmail = () => process.env.BREVO_SENDER_EMAIL || process.env.SMTP_EMAIL || '';

export const isEmailConfigured = (): boolean => {
  if (process.env.BREVO_API_KEY) return !!getSenderEmail();
  return !!(process.env.SMTP_EMAIL && process.env.SMTP_PASSWORD);
};

let smtpTransporter: ReturnType<typeof nodemailer.createTransport> | null = null;
const getSmtpTransporter = () => {
  if (!smtpTransporter) {
    smtpTransporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.SMTP_EMAIL || '',
        pass: process.env.SMTP_PASSWORD || '',
      },
    });
  }
  return smtpTransporter;
};

// Extract display name from `"Name" <email>` format
const parseSenderName = (from?: string): string => {
  if (!from) return DEFAULT_SENDER_NAME;
  const match = from.match(/^\s*"?([^"<]*?)"?\s*<[^>]+>\s*$/);
  return (match && match[1].trim()) || DEFAULT_SENDER_NAME;
};

const sendViaBrevo = async (options: MailOptions) => {
  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': process.env.BREVO_API_KEY as string,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      sender: { name: parseSenderName(options.from), email: getSenderEmail() },
      to: [{ email: options.to }],
      subject: options.subject,
      htmlContent: options.html,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Brevo API error ${response.status}: ${body}`);
  }
  return response.json();
};

export const mailer = {
  sendMail: async (options: MailOptions) => {
    if (process.env.BREVO_API_KEY) {
      return sendViaBrevo(options);
    }
    return getSmtpTransporter().sendMail({
      from: options.from || `"${DEFAULT_SENDER_NAME}" <${process.env.SMTP_EMAIL}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
    });
  },
};
