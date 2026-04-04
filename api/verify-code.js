// api/verify-code.js — Vercel serverless function
// Verifies the 6-digit code and returns Pro unlock confirmation

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email, code } = req.body;
  if (!email || !code) return res.status(400).json({ error: 'Email and code required' });

  const stored = (global.__verificationCodes || {})[email.toLowerCase()];

  if (!stored) {
    return res.status(400).json({ error: 'No verification code found. Please request a new one.' });
  }

  if (Date.now() > stored.expires) {
    delete global.__verificationCodes[email.toLowerCase()];
    return res.status(400).json({ error: 'Code expired. Please request a new one.' });
  }

  if (stored.code !== code.trim()) {
    return res.status(400).json({ error: 'Invalid code. Please check and try again.' });
  }

  // Code is valid — clean up
  const userName = stored.name;
  delete global.__verificationCodes[email.toLowerCase()];

  // Optionally: add to Resend audience for future marketing
  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  const RESEND_AUDIENCE_ID = process.env.RESEND_AUDIENCE_ID;

  if (RESEND_API_KEY && RESEND_AUDIENCE_ID) {
    try {
      await fetch(`https://api.resend.com/audiences/${RESEND_AUDIENCE_ID}/contacts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          email: email.toLowerCase(),
          first_name: userName.split(' ')[0],
          last_name: userName.split(' ').slice(1).join(' ') || '',
          unsubscribed: false,
        }),
      });
    } catch (e) {
      // Non-blocking — don't fail the unlock if audience add fails
      console.error('Failed to add to audience:', e.message);
    }
  }

  return res.status(200).json({
    success: true,
    message: 'Pro unlocked!',
    name: userName,
  });
}
