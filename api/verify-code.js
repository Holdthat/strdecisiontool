// api/verify-code.js — Stateless verification
// Verifies code against signed token (no server storage)
// Then: adds to audience, notifies agents, sends welcome email

import crypto from 'crypto';

function verifyToken(token, userCode) {
  try {
    const secret = process.env.RESEND_API_KEY;
    const decoded = JSON.parse(Buffer.from(token, 'base64').toString('utf-8'));
    const { email, code, expiresAt, sig } = decoded;
    
    // Check expiry
    if (Date.now() > expiresAt) return { valid: false, error: 'Code expired. Please request a new one.' };
    
    // Check signature (prevents tampering)
    const payload = `${email}:${code}:${expiresAt}`;
    const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex');
    if (sig !== expected) return { valid: false, error: 'Invalid token.' };
    
    // Check code matches
    if (code !== userCode.trim()) return { valid: false, error: 'Invalid code. Please check and try again.' };
    
    return { valid: true, email };
  } catch (e) {
    return { valid: false, error: 'Invalid verification data.' };
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { code, token, name, phone, notifyEmails: notifyEmailsRaw, discoveryData } = req.body;
  if (!code || !token) return res.status(400).json({ error: 'Code and token required' });

  const result = verifyToken(token, code);
  if (!result.valid) return res.status(400).json({ error: result.error });

  const email = result.email;
  const userName = name || 'Pro User';
  const userPhone = phone || '';

  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  const FROM_EMAIL = process.env.FROM_EMAIL || 'PropertyPath <noreply@vacationhomegroup.net>';
  const RESEND_AUDIENCE_ID = process.env.RESEND_AUDIENCE_ID;

  // ── 1. Add to Resend audience ──
  if (RESEND_API_KEY && RESEND_AUDIENCE_ID) {
    try {
      await fetch(`https://api.resend.com/audiences/${RESEND_AUDIENCE_ID}/contacts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${RESEND_API_KEY}` },
        body: JSON.stringify({
          email: email.toLowerCase(),
          first_name: userName.split(' ')[0],
          last_name: userName.split(' ').slice(1).join(' ') || '',
          unsubscribed: false,
        }),
      });
    } catch (e) { console.error('Audience add failed:', e.message); }
  }

  // ── 2. Notify Joe and Dino ──
  // Parse notification emails from request, fallback to defaults
  const defaultNotify = ['joemori@vacationhome.group', 'dinoamato@vacationhome.group'];
  const notifyEmails = notifyEmailsRaw
    ? notifyEmailsRaw.split(',').map(e => e.trim()).filter(e => e.includes('@'))
    : defaultNotify;

  if (RESEND_API_KEY && notifyEmails.length > 0) {
    const now = new Date().toLocaleString('en-US', { timeZone: 'America/New_York' });
    try {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${RESEND_API_KEY}` },
        body: JSON.stringify({
          from: FROM_EMAIL,
          to: notifyEmails,
          subject: `PropertyPath Pro Signup: ${userName}`,
          html: `
            <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;padding:32px;background:#F8FAFC;border-radius:12px;">
              <div style="text-align:center;margin-bottom:24px;">
                <h1 style="font-size:22px;color:#167A5E;margin:0;">Property<span style="color:#9A7820;">Path</span></h1>
                <p style="color:#94A3B8;font-size:12px;margin-top:4px;">New Pro Signup Notification</p>
              </div>
              <div style="background:#FFFFFF;border:1px solid #E2E8F0;border-radius:10px;padding:20px;margin-bottom:20px;">
                <table style="width:100%;font-size:15px;color:#1E293B;">
                  <tr><td style="padding:6px 0;color:#94A3B8;width:100px;">Name</td><td style="padding:6px 0;font-weight:700;">${userName}</td></tr>
                  <tr><td style="padding:6px 0;color:#94A3B8;">Email</td><td style="padding:6px 0;"><a href="mailto:${email}" style="color:#167A5E;">${email}</a></td></tr>
                  ${userPhone ? `<tr><td style="padding:6px 0;color:#94A3B8;">Phone</td><td style="padding:6px 0;"><a href="tel:${userPhone}" style="color:#167A5E;">${userPhone}</a></td></tr>` : ''}
                  <tr><td style="padding:6px 0;color:#94A3B8;">App</td><td style="padding:6px 0;">PropertyPath Pro</td></tr>
                  <tr><td style="padding:6px 0;color:#94A3B8;">Time</td><td style="padding:6px 0;">${now} ET</td></tr>
                </table>
              </div>
              ${discoveryData ? `
              <div style="background:#FFFFFF;border:1px solid #E2E8F0;border-radius:10px;padding:20px;margin-bottom:20px;">
                <p style="font-size:13px;font-weight:700;color:#9A7820;margin:0 0 12px;text-transform:uppercase;letter-spacing:0.08em;">Client Profile</p>
                <table style="width:100%;font-size:14px;color:#1E293B;">
                  <tr><td style="padding:5px 0;color:#94A3B8;width:110px;">Situation</td><td style="padding:5px 0;">${discoveryData.situation || '-'}</td></tr>
                  <tr><td style="padding:5px 0;color:#94A3B8;">Priority</td><td style="padding:5px 0;">${discoveryData.priority || '-'}</td></tr>
                  <tr><td style="padding:5px 0;color:#94A3B8;">Risk Level</td><td style="padding:5px 0;">${discoveryData.risk || '-'}</td></tr>
                  <tr><td style="padding:5px 0;color:#94A3B8;">Timeline</td><td style="padding:5px 0;">${discoveryData.timeline || '-'}</td></tr>
                  <tr><td style="padding:5px 0;color:#94A3B8;">Experience</td><td style="padding:5px 0;">${discoveryData.experience || '-'}</td></tr>
                </table>
              </div>` : ''}
              <div style="text-align:center;">
                <a href="mailto:${email}" style="display:inline-block;padding:10px 24px;background:#167A5E;color:#FFFFFF;border-radius:8px;font-size:14px;font-weight:700;text-decoration:none;">Reply to ${userName.split(' ')[0]}</a>
              </div>
            </div>
          `,
        }),
      });
    } catch (e) { console.error('Notification failed:', e.message); }
  }

  // ── 3. Welcome email to user ──
  if (RESEND_API_KEY) {
    try {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${RESEND_API_KEY}` },
        body: JSON.stringify({
          from: FROM_EMAIL,
          to: email,
          subject: 'Welcome to PropertyPath Pro!',
          html: `
            <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#F8FAFC;border-radius:12px;">
              <div style="text-align:center;margin-bottom:24px;">
                <h1 style="font-size:24px;color:#167A5E;margin:0;">Property<span style="color:#9A7820;">Path</span></h1>
                <p style="color:#94A3B8;font-size:13px;margin-top:4px;">by Vacation Home Group</p>
              </div>
              <p style="font-size:16px;color:#1E293B;line-height:1.6;">Hi ${userName},</p>
              <p style="font-size:16px;color:#1E293B;line-height:1.6;">
                Welcome to PropertyPath Pro! You now have access to:
              </p>
              <ul style="font-size:15px;color:#1E293B;line-height:2;padding-left:20px;">
                <li><strong>Tax Benefits Calculator</strong></li>
                <li><strong>Mortgage Comparison</strong> with charts</li>
                <li><strong>What-If Snapshots</strong></li>
                <li><strong>AI Investment Summary</strong></li>
              </ul>
              <p style="font-size:16px;color:#1E293B;line-height:1.6;">Questions? We're here:</p>
              <div style="background:#FFFFFF;border:1px solid #E2E8F0;border-radius:10px;padding:16px;margin:16px 0;">
                <table style="width:100%;font-size:14px;color:#1E293B;">
                  <tr>
                    <td style="padding:4px 12px 4px 0;vertical-align:top;">
                      <strong>Joe Mori</strong><br/><span style="color:#94A3B8;">603-901-7777</span><br/>
                      <a href="mailto:joemori@vacationhome.group" style="color:#9A7820;font-size:13px;">joemori@vacationhome.group</a>
                    </td>
                    <td style="padding:4px 0 4px 12px;vertical-align:top;border-left:1px solid #E2E8F0;">
                      <strong>Dino Amato</strong><br/><span style="color:#94A3B8;">603-275-1191</span><br/>
                      <a href="mailto:dinoamato@vacationhome.group" style="color:#9A7820;font-size:13px;">dinoamato@vacationhome.group</a>
                    </td>
                  </tr>
                </table>
              </div>
              <hr style="border:none;border-top:1px solid #E2E8F0;margin:24px 0;"/>
              <p style="font-size:12px;color:#94A3B8;text-align:center;">
                Vacation Home Group &middot; Real Broker NH &middot; 855-450-0442<br/>
                <a href="https://www.vacationhomegroup.net" style="color:#9A7820;">vacationhomegroup.net</a>
              </p>
            </div>
          `,
        }),
      });
    } catch (e) { console.error('Welcome email failed:', e.message); }
  }

  return res.status(200).json({ success: true, message: 'Pro unlocked!', name: userName });
}
