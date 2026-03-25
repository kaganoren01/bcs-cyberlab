import { neon } from '@netlify/neon';
import bcrypt from 'bcryptjs';

const DEFAULT_DOMAINS = ['bruins.belmont.edu', 'belmont.edu'];

async function getAllowedDomains(sql) {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS settings (
        key VARCHAR(100) PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;
    const rows = await sql`SELECT value FROM settings WHERE key = 'allowed_domains'`;
    return rows.length > 0 ? JSON.parse(rows[0].value) : DEFAULT_DOMAINS;
  } catch {
    return DEFAULT_DOMAINS;
  }
}

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
  const domain = email?.split('@')[1];

  const sql = neon();
  const allowedDomains = await getAllowedDomains(sql);

  const isOpen = allowedDomains.includes('*');
  if (!isOpen && (!domain || !allowedDomains.includes(domain))) {
    const domainList = allowedDomains.map(d => `@${d}`).join(' or ');
    return {
      statusCode: 403,
      body: JSON.stringify({ error: `Only ${domainList} email addresses are allowed.` }),
    };
  }

  if (!password || password.length < 8) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Password must be at least 8 characters.' }),
    };
  }

  // Ensure users table exists
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `;

  const existing = await sql`SELECT id FROM users WHERE email = ${email}`;
  if (existing.length > 0) {
    return {
      statusCode: 409,
      body: JSON.stringify({ error: 'An account with this email already exists.' }),
    };
  }

  const hash = await bcrypt.hash(password, 10);
  await sql`INSERT INTO users (email, password_hash) VALUES (${email}, ${hash})`;

  return {
    statusCode: 201,
    body: JSON.stringify({ message: 'Account created. You can now sign in.' }),
  };
};
