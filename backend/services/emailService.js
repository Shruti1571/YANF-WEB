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

async function sendCertificateOtpEmail(toEmail, otpCode, certificateNumber, eventTitle) {
  const transporter = createTransporter();
  const from = process.env.SMTP_FROM || '"YANF Global Secretariat" <credentials@yanfglobal.com>';
  const subject = `🎓 Certificate Download Passcode: ${otpCode} [${certificateNumber}]`;
  const html = `
    <div style="font-family: 'Space Grotesk', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #060d14; color: #eef4f8; padding: 36px; border-radius: 12px; max-width: 580px; margin: 0 auto; border: 1px solid rgba(143, 208, 255, 0.2);">
      <div style="text-align: center; margin-bottom: 24px;">
        <span style="font-size: 20px; font-weight: 700; letter-spacing: 4px; color: #8fd0ff;">Y A N F</span>
        <p style="font-size: 11px; letter-spacing: 2px; color: rgba(238, 244, 248, 0.6); margin-top: 4px;">CREDENTIAL VERIFICATION SERVICE</p>
      </div>
      <div style="background: rgba(143, 208, 255, 0.05); border: 1px solid rgba(143, 208, 255, 0.15); border-radius: 8px; padding: 20px; margin-bottom: 24px;">
        <p style="margin: 0 0 8px 0; font-size: 14px; color: rgba(238, 244, 248, 0.7);">Event: <strong style="color: #fff;">${eventTitle || 'YANF Assembly'}</strong></p>
        <p style="margin: 0; font-size: 14px; color: rgba(238, 244, 248, 0.7);">Certificate ID: <strong style="color: #ffcf6f; font-family: monospace;">${certificateNumber}</strong></p>
      </div>
      <p style="font-size: 15px; line-height: 1.5; color: rgba(238, 244, 248, 0.85);">
        You requested to download the high-resolution official PDF of your certificate. Use the one-time verification passcode below:
      </p>
      <div style="background: rgba(255, 207, 111, 0.1); border: 1px solid #ffcf6f; padding: 20px; text-align: center; margin: 28px 0; border-radius: 8px;">
        <span style="font-size: 36px; font-weight: 700; letter-spacing: 10px; color: #ffcf6f; font-family: monospace;">${otpCode}</span>
      </div>
      <p style="font-size: 13px; color: rgba(238, 244, 248, 0.5); line-height: 1.4;">
        ⏱️ This code expires in 10 minutes. For security reasons, do not share this passcode with anyone. If you did not initiate this download request, your record remains secure.
      </p>
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid rgba(238, 244, 248, 0.1); font-size: 11px; color: rgba(238, 244, 248, 0.4); text-align: center;">
        Youth As Nations' Front Global Verification Portal • yanfglobal.com
      </div>
    </div>
  `;

  if (!transporter) {
    console.log(`\n========================================`);
    console.log(`🎓 CERTIFICATE OTP FOR ${toEmail} [${certificateNumber}]: ${otpCode}`);
    console.log(`========================================\n`);
    return true;
  }

  try {
    await transporter.sendMail({ from, to: toEmail, subject, html });
    console.log(`✉️ Certificate OTP email sent to ${toEmail}`);
    return true;
  } catch (error) {
    console.error('❌ Failed to send certificate OTP email:', error.message);
    console.log(`\n========================================`);
    console.log(`🎓 FALLBACK DEV MODE OTP FOR ${toEmail}: ${otpCode}`);
    console.log(`========================================\n`);
    return false;
  }
}

module.exports = { sendOtpEmail, sendCertificateOtpEmail };
