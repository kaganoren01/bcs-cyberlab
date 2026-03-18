// onChunk(text) is called incrementally as the response streams in
export async function explainRecord(tableLabel, tableDescription, record, onChunk) {
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
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 600,
      stream: true,
      system: `You are a cybersecurity instructor teaching students SOC analysis and incident response at an MSSP.
Explain records clearly and practically — what an analyst would care about, what action may be needed, and what the record reveals about security posture.
Keep responses under 280 words. Use plain language; explain jargon when used.`,
      messages: [{
        role: 'user',
        content: `I'm looking at a record from the **${tableLabel}** table.

Table context: ${tableDescription}

Record data:
\`\`\`json
${JSON.stringify(record, null, 2)}
\`\`\`

Explain:
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

  // Parse the SSE stream
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop(); // keep incomplete last line

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const data = line.slice(6).trim();
      if (data === '[DONE]') return;
      try {
        const parsed = JSON.parse(data);
        if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
          onChunk(parsed.delta.text);
        }
      } catch {
        // skip malformed lines
      }
    }
  }
}
