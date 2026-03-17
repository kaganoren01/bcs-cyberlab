export async function explainRecord(tableLabel, tableDescription, record) {
  const API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY;
  if (!API_KEY) throw new Error('No API key set. Add VITE_ANTHROPIC_API_KEY to your .env.local file.');

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 800,
      system: `You are a cybersecurity instructor teaching students who are learning SOC analysis and incident response.
You work at an MSSP (Managed Security Service Provider).
When shown a data record, explain it clearly and practically.
Focus on what a real analyst would care about, what action might be needed, and what this record tells us about the security posture.
Keep responses under 350 words. Use plain language — avoid jargon unless you explain it.`,
      messages: [{
        role: 'user',
        content: `I'm looking at a record from the **${tableLabel}** table.

Table context: ${tableDescription}

Record data:
\`\`\`json
${JSON.stringify(record, null, 2)}
\`\`\`

Please explain:
1. What this record represents in a real-world SOC/IR context
2. What an analyst should notice or act on
3. Any red flags, patterns, or follow-up questions this raises`,
      }],
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `API error ${response.status}`);
  }

  const data = await response.json();
  return data.content[0].text;
}
