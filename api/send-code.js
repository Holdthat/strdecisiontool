// api/send-code.js — Vercel serverless function
// Sends a 6-digit verification code via Resend email API
// Environment variables needed: RESEND_API_KEY, FROM_EMAIL

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email, name } = req.body;
  if (!email || !name) return res.status(400).json({ error: 'Name and email required' });

  // Generate 6-digit code
  const code = String(Math.floor(100000 + Math.random() * 900000));

  // Store code temporarily (in-memory for now; for production use Redis/KV)
  // Vercel KV or a simple expiry map would work here
  global.__verificationCodes = global.__verificationCodes || {};
  global.__verificationCodes[email.toLowerCase()] = {
    code,
    name,
    expires: Date.now() + 10 * 60 * 1000, // 10 minutes
  };

  // Send via Resend
  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  const FROM_EMAIL = process.env.FROM_EMAIL || 'STRInvestCalc <noreply@vacationhomegroup.net>';

  if (!RESEND_API_KEY) {
    return res.status(500).json({ error: 'Resend API key not configured. Set RESEND_API_KEY in Vercel environment variables.' });
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: email,
        subject: 'Your STRInvestCalc Pro Verification Code',
        html: `
          <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#F8FAFC;border-radius:12px;">
            <div style="text-align:center;margin-bottom:24px;">
              <h1 style="font-size:24px;color:#167A5E;margin:0;">STR<span style="color:#9A7820;">Invest</span>Calc</h1>
              <p style="color:#94A3B8;font-size:13px;margin-top:4px;">by Vacation Home Group</p>
            </div>
            <p style="font-size:16px;color:#1E293B;line-height:1.6;">
              Hi ${name},
            </p>
            <p style="font-size:16px;color:#1E293B;line-height:1.6;">
              Your verification code is:
            </p>
            <div style="text-align:center;margin:24px 0;">
              <div style="display:inline-block;padding:16px 40px;background:#0B1120;border-radius:10px;font-family:'Courier New',monospace;font-size:36px;font-weight:700;color:#F8FAFC;letter-spacing:8px;">
                ${code}
              </div>
            </div>
            <p style="font-size:14px;color:#64748B;line-height:1.6;">
              This code expires in 10 minutes. If you didn't request this, you can safely ignore this email.
            </p>
            <hr style="border:none;border-top:1px solid #E2E8F0;margin:24px 0;"/>
            <p style="font-size:12px;color:#94A3B8;text-align:center;">
              Vacation Home Group · Joe Mori & Dino Amato · Real Broker NH<br/>
              <a href="https://www.vacationhomegroup.net" style="color:#9A7820;">vacationhomegroup.net</a>
            </p>
          </div>
        `,
      }),
    });

    const data = await response.json();
    if (response.ok) {
      return res.status(200).json({ success: true, message: 'Verification code sent' });
    } else {
      return res.status(500).json({ error: 'Failed to send email', details: data });
    }
  } catch (err) {
    return res.status(500).json({ error: 'Email service error', details: err.message });
  }
}
