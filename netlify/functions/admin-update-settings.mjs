import { neon } from '@netlify/neon';
import jwt from 'jsonwebtoken';

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  // Verify JWT and admin status
  const auth = event.headers['authorization'] || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized.' }) };
  }

  const secret = process.env.JWT_SECRET;
  let payload;
  try {
    payload = jwt.verify(token, secret);
  } catch {
    return { statusCode: 401, body: JSON.stringify({ error: 'Invalid or expired token.' }) };
  }

  if (!payload.isAdmin) {
    return { statusCode: 403, body: JSON.stringify({ error: 'Admin access required.' }) };
  }

  let allowedDomains;
  try {
    ({ allowedDomains } = JSON.parse(event.body));
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid request body.' }) };
  }

  if (!Array.isArray(allowedDomains)) {
    return { statusCode: 400, body: JSON.stringify({ error: 'allowedDomains must be an array.' }) };
  }

  const sql = neon();

  await sql`
    CREATE TABLE IF NOT EXISTS settings (
      key VARCHAR(100) PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `;

  await sql`
    INSERT INTO settings (key, value, updated_at)
    VALUES ('allowed_domains', ${JSON.stringify(allowedDomains)}, NOW())
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
  `;

  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'Settings updated.', allowedDomains }),
  };
};
