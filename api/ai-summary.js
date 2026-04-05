// api/ai-summary.js — Server-side AI proxy (avoids CORS)
// Env vars: ANTHROPIC_API_KEY for Claude

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { provider, prompt, maxTokens, geminiKey } = req.body || {};
  if (!prompt) return res.status(400).json({ error: 'Prompt required' });

  try {
    if (provider === 'gemini') {
      if (!geminiKey) {
        return res.status(400).json({ error: 'No Gemini API key. Go to Admin tab (?admin=true) to configure.' });
      }

      const resp = await fetch(
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': geminiKey,
          },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { maxOutputTokens: (maxTokens || 400) * 3 },
          }),
        }
      );

      const data = await resp.json();

      if (!resp.ok) {
        const errMsg = data?.error?.message || JSON.stringify(data?.error) || `Google API error (${resp.status})`;
        return res.status(resp.status).json({ error: 'Gemini error: ' + errMsg });
      }

      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        const blockReason = data?.candidates?.[0]?.finishReason || data?.promptFeedback?.blockReason;
        return res.status(200).json({ error: blockReason ? 'Gemini blocked: ' + blockReason : 'Gemini returned empty response.' });
      }
      return res.status(200).json({ text });

    } else {
      // Claude
      const apiKey = process.env.ANTHROPIC_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: 'ANTHROPIC_API_KEY not set. Add it to Vercel Environment Variables.' });
      }

      const resp = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: maxTokens || 400,
          messages: [{ role: 'user', content: prompt }],
        }),
      });

      const data = await resp.json();

      if (!resp.ok) {
        const errMsg = data?.error?.message || JSON.stringify(data?.error) || `Anthropic error (${resp.status})`;
        return res.status(resp.status).json({ error: 'Claude error: ' + errMsg });
      }

      const text = data?.content?.[0]?.text;
      return res.status(200).json({ text: text || 'Claude returned empty response.' });
    }
  } catch (err) {
    return res.status(500).json({ error: 'AI proxy error: ' + (err.message || String(err)) });
  }
}
