import { neon } from '@netlify/neon';

const DEFAULT_DOMAINS = ['bruins.belmont.edu', 'belmont.edu'];

export const handler = async () => {
  try {
    const sql = neon();

    await sql`
      CREATE TABLE IF NOT EXISTS settings (
        key VARCHAR(100) PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;

    const rows = await sql`SELECT value FROM settings WHERE key = 'allowed_domains'`;
    const parsed = rows.length > 0 ? JSON.parse(rows[0].value) : DEFAULT_DOMAINS;
    // Fall back to defaults if the stored list is empty (prevents accidental lockout)
    const domains = Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_DOMAINS;

    return {
      statusCode: 200,
      body: JSON.stringify({
        allowedDomains: domains,
        isOpen: domains.includes('*'),
      }),
    };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
  }
};
