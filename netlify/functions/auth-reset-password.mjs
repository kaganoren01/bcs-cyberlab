import { neon } from '@netlify/neon';
import bcrypt from 'bcryptjs';

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let email, token, password;
  try {
    ({ email, token, password } = JSON.parse(event.body));
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid request body.' }) };
  }

  email = email?.toLowerCase().trim();

  if (!email || !token || !password) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Missing required fields.' }) };
  }

  if (password.length < 8) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Password must be at least 8 characters.' }) };
  }

  const sql = neon();

  const rows = await sql`
    SELECT id, reset_token, reset_expires
    FROM users
    WHERE email = ${email}
  `;

  const user = rows[0];
  const invalid = { statusCode: 400, body: JSON.stringify({ error: 'Reset link is invalid or has expired.' }) };

  if (!user || user.reset_token !== token) return invalid;
  if (!user.reset_expires || new Date(user.reset_expires) < new Date()) return invalid;

  const hash = await bcrypt.hash(password, 10);

  await sql`
    UPDATE users
    SET password_hash = ${hash}, reset_token = NULL, reset_expires = NULL
    WHERE id = ${user.id}
  `;

  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'Password updated successfully. You can now sign in.' }),
  };
};
