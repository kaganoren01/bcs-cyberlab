import { neon } from '@netlify/neon';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let email, password;
  try {
    ({ email, password } = JSON.parse(event.body));
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid request body.' }) };
  }

  email = email?.toLowerCase().trim();

  const sql = neon();
  const rows = await sql`SELECT * FROM users WHERE email = ${email}`;
  const user = rows[0];

  // Use a consistent error message to avoid user enumeration
  const invalidMsg = 'Invalid email or password.';
  if (!user) {
    return { statusCode: 401, body: JSON.stringify({ error: invalidMsg }) };
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    return { statusCode: 401, body: JSON.stringify({ error: invalidMsg }) };
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Server misconfiguration: JWT_SECRET not set.' }) };
  }

  const token = jwt.sign(
    { userId: user.id, email: user.email },
    secret,
    { expiresIn: '7d' }
  );

  return {
    statusCode: 200,
    body: JSON.stringify({ token, email: user.email }),
  };
};
