// api/ai-summary.js — Proxies AI requests through server to avoid CORS
// Supports Claude (Anthropic) and Gemini (Google AI)
// Env vars: ANTHROPIC_API_KEY (for Claude), or client passes Gemini key

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { provider, prompt, maxTokens, geminiKey } = req.body;
  if (!prompt) return res.status(400).json({ error: 'Prompt required' });

  try {
    if (provider === 'gemini') {
      const key = geminiKey;
      if (!key) return res.status(400).json({ error: 'No Gemini API key provided. Configure in Admin settings.' });

      const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: maxTokens || 400 },
        }),
      });
      const data = await resp.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      return res.status(200).json({ text: text || 'Gemini returned no content. Check your API key.' });

    } else {
      // Claude (default)
      const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
      if (!ANTHROPIC_API_KEY) {
        return res.status(500).json({ error: 'Claude API key not configured. Add ANTHROPIC_API_KEY to Vercel environment variables.' });
      }

      const resp = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: maxTokens || 400,
          messages: [{ role: 'user', content: prompt }],
        }),
      });
      const data = await resp.json();
      const text = data?.content?.[0]?.text;
      if (text) {
        return res.status(200).json({ text });
      } else {
        return res.status(500).json({ error: data?.error?.message || 'Claude returned no content.' });
      }
    }
  } catch (err) {
    return res.status(500).json({ error: 'AI service error: ' + err.message });
  }
}
