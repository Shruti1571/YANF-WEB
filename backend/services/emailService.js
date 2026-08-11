const nodemailer = require('nodemailer');

function createTransporter() {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!user || !pass) {
    console.warn('⚠️ SMTP credentials missing. OTP will be printed to server console in dev mode.');
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass }
  });
}

async function sendOtpEmail(toEmail, otpCode) {
  const transporter = createTransporter();
  const from = process.env.SMTP_FROM || '"YANF Platform" <noreply@yanfglobal.com>';

  const subject = '🔐 YANF Admin Login OTP Verification';
  const html = `
    <div style="font-family: Arial, sans-serif; background: #060d14; color: #eef4f8; padding: 30px; border-radius: 8px;">
      <h2 style="color: #8fd0ff; letter-spacing: 2px;">Y A N F — Admin Security</h2>
      <p style="font-size: 16px; color: rgba(238, 244, 248, 0.8);">Your one-time passcode for admin authentication is:</p>
      <div style="background: rgba(143, 208, 255, 0.1); border: 1px solid #8fd0ff; padding: 18px; text-align: center; margin: 20px 0; border-radius: 6px;">
        <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #ffcf6f;">${otpCode}</span>
      </div>
      <p style="font-size: 13px; color: rgba(238, 244, 248, 0.5);">This passcode is valid for 5 minutes. If you did not request this, please ignore this email.</p>
    </div>
  `;

  if (!transporter) {
    console.log(`\n========================================`);
    console.log(`🔑 DEV MODE OTP FOR ${toEmail}: ${otpCode}`);
    console.log(`========================================\n`);
    return true;
  }

  try {
    await transporter.sendMail({
      from,
      to: toEmail,
      subject,
      html
    });
    console.log(`✉️ OTP email sent to ${toEmail}`);
    return true;
  } catch (error) {
    console.error('❌ Failed to send OTP email via SMTP:', error.message);
    console.log(`\n========================================`);
    console.log(`🔑 FALLBACK DEV MODE OTP FOR ${toEmail}: ${otpCode}`);
    console.log(`========================================\n`);
    return false;
  }
}

module.exports = { sendOtpEmail };
