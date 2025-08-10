// src/utils/mailer.js
import nodemailer from 'nodemailer';

let transporter = null;

function assertEnv() {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  const from = process.env.EMAIL_FROM || (user ? `28 Degrees West <${user}>` : '');
  if (!user) throw new Error('GMAIL_USER is not set');
  if (!pass) throw new Error('GMAIL_APP_PASSWORD is not set (Gmail App Password required)');
  return { user, pass, from };
}

export function getTransporter() {
  if (transporter) return transporter;
  const { user, pass } = assertEnv();
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
  });
  return transporter;
}

/**
 * Send an email
 * @param {Object} opts
 * @param {string|string[]} opts.to
 * @param {string} opts.subject
 * @param {string} opts.html
 * @param {string} [opts.text]
 */
export async function sendMail({ to, subject, html, text }) {
  const { from } = assertEnv();        // ensures clear error if misconfigured
  const tx = getTransporter();
  return tx.sendMail({
    from,
    to,
    subject,
    html,
    text: text || html.replace(/<[^>]+>/g, ' ').trim(),
  });
}
