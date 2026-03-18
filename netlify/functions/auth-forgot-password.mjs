import { neon } from '@netlify/neon';
import nodemailer from 'nodemailer';
import { randomBytes } from 'crypto';

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let email;
  try {
    ({ email } = JSON.parse(event.body));
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid request body.' }) };
  }

  email = email?.toLowerCase().trim();
  if (!email) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Email is required.' }) };
  }

  const sql = neon();

  // Ensure reset columns exist
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token VARCHAR(255)`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_expires TIMESTAMP WITH TIME ZONE`;

  const users = await sql`SELECT id FROM users WHERE email = ${email}`;

  // Always return success — never reveal whether an email exists
  if (users.length === 0) {
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'If that email exists, a reset link has been sent.' }),
    };
  }

  const token = randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await sql`
    UPDATE users
    SET reset_token = ${token}, reset_expires = ${expires.toISOString()}
    WHERE email = ${email}
  `;

  const siteUrl = process.env.URL || 'http://localhost:5173';
  const resetUrl = `${siteUrl}/?reset_token=${token}&email=${encodeURIComponent(email)}`;

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });

  await transporter.sendMail({
    from: `BCS CyberLab <${process.env.GMAIL_USER}>`,
    to: email,
    subject: 'Reset your BCS CyberLab password',
    html: `
      <div style="font-family: monospace; background: #0d1117; color: #e6edf3; padding: 32px; max-width: 480px; border-radius: 8px;">
        <h2 style="color: #3fb950; margin-top: 0;">[BCS CyberLab]</h2>
        <p>You requested a password reset. Click the link below to set a new password:</p>
        <a href="${resetUrl}"
           style="display: inline-block; background: #238636; color: #fff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; margin: 16px 0;">
          Reset Password
        </a>
        <p style="color: #8b949e; font-size: 13px;">This link expires in <strong style="color: #e6edf3;">1 hour</strong>.<br>If you didn't request this, you can safely ignore this email.</p>
      </div>
    `,
  });

  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'If that email exists, a reset link has been sent.' }),
  };
};
