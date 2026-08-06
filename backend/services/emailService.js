// services/emailService.js — Nodemailer email alerts
const nodemailer = require('nodemailer');

// Create transporter (Gmail)
const createTransporter = () => {
  if (!process.env.EMAIL_USER || process.env.EMAIL_USER === 'your_gmail@gmail.com') {
    return null; // Email not configured
  }
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

// ── Send hazard alert to all subscribed users ──
const sendHazardAlert = async (hazard, users) => {
  const transporter = createTransporter();
  if (!transporter) {
    console.log('📧 Email not configured — skipping alert emails');
    return { sent: 0, skipped: users.length };
  }

  const severityColor = {
    critical: '#ff4d6d',
    warning:  '#ffa500',
    monitor:  '#1dd3b0',
  }[hazard.severity] || '#1dd3b0';

  const severityEmoji = {
    critical: '🚨',
    warning:  '⚠️',
    monitor:  '📡',
  }[hazard.severity] || '📡';

  let sent = 0;
  for (const user of users) {
    try {
      await transporter.sendMail({
        from:    `"Wavy 🌊" <${process.env.EMAIL_USER}>`,
        to:      user.email,
        subject: `${severityEmoji} ${hazard.severity.toUpperCase()} Alert: ${hazard.name} — Wavy`,
        html: `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#020e1a;font-family:'DM Sans',Arial,sans-serif;">
  <div style="max-width:580px;margin:0 auto;padding:32px 16px;">

    <!-- Header -->
    <div style="background:linear-gradient(135deg,#042f4b,#0a7e8c);border-radius:16px 16px 0 0;padding:32px;text-align:center;">
      <div style="font-size:42px;margin-bottom:8px;">🌊</div>
      <h1 style="color:#1dd3b0;font-size:24px;margin:0;font-weight:800;letter-spacing:-0.5px;">Wavy</h1>
      <p style="color:rgba(232,244,248,0.7);font-size:13px;margin:4px 0 0;">Ocean Hazard Detector</p>
    </div>

    <!-- Alert Banner -->
    <div style="background:${severityColor}22;border:1px solid ${severityColor}44;border-top:none;padding:20px 32px;text-align:center;">
      <div style="font-size:32px;">${severityEmoji}</div>
      <div style="background:${severityColor};color:white;display:inline-block;padding:5px 18px;border-radius:20px;font-size:13px;font-weight:700;margin:8px 0;">
        ${hazard.severity.toUpperCase()} ALERT
      </div>
      <h2 style="color:#e8f4f8;font-size:22px;margin:10px 0 4px;">${hazard.name}</h2>
      <p style="color:#7fafc4;font-size:14px;margin:0;">📍 ${hazard.location_desc}</p>
    </div>

    <!-- Details -->
    <div style="background:#042f4b;border:1px solid rgba(29,211,176,0.15);border-top:none;padding:28px 32px;">
      <table style="width:100%;border-collapse:collapse;">
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid rgba(29,211,176,0.08);color:#7fafc4;font-size:13px;width:45%;">Hazard Type</td>
          <td style="padding:10px 0;border-bottom:1px solid rgba(29,211,176,0.08);color:#e8f4f8;font-size:13px;font-weight:600;">${hazard.type}</td>
        </tr>
        ${hazard.wind_speed ? `
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid rgba(29,211,176,0.08);color:#7fafc4;font-size:13px;">Wind Speed</td>
          <td style="padding:10px 0;border-bottom:1px solid rgba(29,211,176,0.08);color:#e8f4f8;font-size:13px;font-weight:600;">${hazard.wind_speed} km/h</td>
        </tr>` : ''}
        ${hazard.affected_people > 0 ? `
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid rgba(29,211,176,0.08);color:#7fafc4;font-size:13px;">People Affected</td>
          <td style="padding:10px 0;border-bottom:1px solid rgba(29,211,176,0.08);color:#e8f4f8;font-size:13px;font-weight:600;">${hazard.affected_people.toLocaleString()}</td>
        </tr>` : ''}
        <tr>
          <td style="padding:10px 0;color:#7fafc4;font-size:13px;">Description</td>
          <td style="padding:10px 0;color:#e8f4f8;font-size:13px;">${hazard.description || 'No additional details.'}</td>
        </tr>
      </table>

      <!-- Safety Tips -->
      <div style="background:rgba(29,211,176,0.07);border:1px solid rgba(29,211,176,0.15);border-radius:12px;padding:16px 20px;margin-top:20px;">
        <p style="color:#1dd3b0;font-size:13px;font-weight:700;margin:0 0 8px;">🛡️ Safety Tips</p>
        <ul style="color:#7fafc4;font-size:13px;margin:0;padding-left:20px;line-height:1.8;">
          ${hazard.severity === 'critical' ? '<li>Evacuate low-lying coastal areas immediately</li><li>Do not go fishing or sailing</li><li>Follow local authority instructions</li>' :
            hazard.severity === 'warning'  ? '<li>Stay away from shoreline</li><li>Monitor official updates</li><li>Secure boats and equipment</li>' :
            '<li>Stay informed and monitor updates</li><li>Avoid unnecessary sea travel</li>'}
        </ul>
      </div>

      <!-- CTA Button -->
      <div style="text-align:center;margin-top:24px;">
        <a href="${process.env.CLIENT_URL || 'http://127.0.0.1:5500'}/pages/dashboard.html"
           style="background:linear-gradient(135deg,#0a7e8c,#1dd3b0);color:#020e1a;text-decoration:none;
                  padding:13px 32px;border-radius:10px;font-weight:700;font-size:14px;display:inline-block;">
          View on Wavy Dashboard →
        </a>
      </div>
    </div>

    <!-- Emergency Numbers -->
    <div style="background:#031520;border:1px solid rgba(29,211,176,0.08);border-top:none;border-radius:0 0 16px 16px;padding:18px 32px;text-align:center;">
      <p style="color:#7fafc4;font-size:12px;margin:0;">
        🚨 Emergency: Coast Guard <strong style="color:#ff4d6d;">1554</strong> &nbsp;|&nbsp; NDRF <strong style="color:#ff4d6d;">1078</strong> &nbsp;|&nbsp; Disaster <strong style="color:#ff4d6d;">108</strong>
      </p>
      <p style="color:rgba(127,175,196,0.4);font-size:11px;margin:8px 0 0;">
        You received this because you're subscribed to alerts on Wavy. Hi, ${user.name}!
      </p>
    </div>

  </div>
</body>
</html>
        `,
      });
      sent++;
    } catch (err) {
      console.error(`Failed to send email to ${user.email}:`, err.message);
    }
  }

  console.log(`📧 Emails sent: ${sent}/${users.length}`);
  return { sent, skipped: users.length - sent };
};

// ── Send welcome email on register ──
const sendWelcomeEmail = async (user) => {
  const transporter = createTransporter();
  if (!transporter) return;

  try {
    await transporter.sendMail({
      from:    `"Wavy 🌊" <${process.env.EMAIL_USER}>`,
      to:      user.email,
      subject: '🌊 Welcome to Wavy — Ocean Hazard Detector',
      html: `
<body style="margin:0;padding:0;background:#020e1a;font-family:Arial,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:32px 16px;">
    <div style="background:linear-gradient(135deg,#042f4b,#0a7e8c);border-radius:16px;padding:40px;text-align:center;">
      <div style="font-size:48px;margin-bottom:12px;">🌊</div>
      <h1 style="color:#1dd3b0;margin:0;font-size:28px;">Welcome to Wavy!</h1>
      <p style="color:rgba(232,244,248,0.8);margin:12px 0 0;font-size:15px;">Hi ${user.name}, your account is ready.</p>
    </div>
    <div style="background:#042f4b;border:1px solid rgba(29,211,176,0.15);border-top:none;border-radius:0 0 16px 16px;padding:32px;text-align:center;">
      <p style="color:#7fafc4;font-size:14px;line-height:1.7;">You're now protecting your coast with real-time ocean hazard monitoring. We'll alert you about cyclones, oil spills, floods and storms near your location.</p>
      <a href="${process.env.CLIENT_URL || 'http://127.0.0.1:5500'}/pages/dashboard.html"
         style="background:linear-gradient(135deg,#0a7e8c,#1dd3b0);color:#020e1a;text-decoration:none;padding:13px 32px;border-radius:10px;font-weight:700;font-size:14px;display:inline-block;margin-top:20px;">
        Go to Dashboard →
      </a>
      <p style="color:rgba(127,175,196,0.4);font-size:12px;margin-top:24px;">
        Emergency: Coast Guard 1554 | NDRF 1078 | Disaster 108
      </p>
    </div>
  </div>
</body>
      `,
    });
    console.log(`📧 Welcome email sent to ${user.email}`);
  } catch (err) {
    console.error('Welcome email failed:', err.message);
  }
};

module.exports = { sendHazardAlert, sendWelcomeEmail };
