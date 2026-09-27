const bcrypt = require('bcryptjs');
const CertificateOtp = require('../models/CertificateOtp');
const { sendCertificateOtpEmail } = require('./emailService');

const OTP_TTL_MINUTES = 10;
const COOLDOWN_SECONDS = 60;
const MAX_ATTEMPTS = 3;

/**
 * Generate 6-digit numeric OTP
 */
function generate6DigitOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Request OTP for certificate download
 * @param {Object} certificate - Populated certificate document with eventId
 */
async function requestCertificateOtp(certificate) {
  if (!certificate || !certificate.recipientEmail) {
    throw new Error('This certificate does not have an active recipient email associated with it.');
  }

  const email = certificate.recipientEmail.toLowerCase().trim();

  // Check cooldown from latest OTP request
  const recentOtp = await CertificateOtp.findOne({
    certificateId: certificate._id,
    email
  }).sort({ createdAt: -1 });

  if (recentOtp) {
    const elapsedSeconds = Math.floor((Date.now() - new Date(recentOtp.createdAt).getTime()) / 1000);
    if (elapsedSeconds < COOLDOWN_SECONDS) {
      const waitTime = COOLDOWN_SECONDS - elapsedSeconds;
      const err = new Error(`Please wait ${waitTime}s before requesting a new passcode.`);
      err.statusCode = 429;
      err.retryAfter = waitTime;
      throw err;
    }
  }

  // Generate 6-digit OTP and hash
  const rawOtp = generate6DigitOtp();
  const salt = await bcrypt.genSalt(10);
  const otpHash = await bcrypt.hash(rawOtp, salt);

  const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);

  // Invalidate previous OTPs for this certificate
  await CertificateOtp.deleteMany({ certificateId: certificate._id });

  // Store new OTP
  await CertificateOtp.create({
    certificateId: certificate._id,
    email,
    otpHash,
    expiresAt,
    attempts: 0,
    verified: false
  });

  const eventTitle = certificate.eventId ? certificate.eventId.title : 'YANF Assembly';

  // Send email
  await sendCertificateOtpEmail(email, rawOtp, certificate.certificateNumber, eventTitle);

  return {
    success: true,
    maskedEmail: maskEmail(email),
    expiresInSeconds: OTP_TTL_MINUTES * 60
  };
}

/**
 * Verify OTP
 */
async function verifyCertificateOtp(certificateId, email, candidateOtp) {
  const normalizedEmail = (email || '').toLowerCase().trim();

  const otpDoc = await CertificateOtp.findOne({
    certificateId,
    email: normalizedEmail
  });

  if (!otpDoc) {
    const err = new Error('No active verification passcode found. Please request a new one.');
    err.statusCode = 404;
    throw err;
  }

  if (new Date() > otpDoc.expiresAt) {
    await CertificateOtp.deleteOne({ _id: otpDoc._id });
    const err = new Error('Passcode has expired. Please request a new one.');
    err.statusCode = 400;
    throw err;
  }

  if (otpDoc.attempts >= MAX_ATTEMPTS) {
    await CertificateOtp.deleteOne({ _id: otpDoc._id });
    const err = new Error('Too many incorrect attempts. Please request a new passcode.');
    err.statusCode = 429;
    throw err;
  }

  const isMatch = await bcrypt.compare(candidateOtp.trim(), otpDoc.otpHash);
  if (!isMatch) {
    otpDoc.attempts += 1;
    await otpDoc.save();
    const remaining = MAX_ATTEMPTS - otpDoc.attempts;
    const err = new Error(`Incorrect passcode. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`);
    err.statusCode = 400;
    throw err;
  }

  // OTP verified successfully
  otpDoc.verified = true;
  await otpDoc.save();

  return { verified: true };
}

/**
 * Utility to mask email (e.g. ananya@gmail.com -> an****@gmail.com)
 */
function maskEmail(email) {
  if (!email || !email.includes('@')) return 'your registered email';
  const [user, domain] = email.split('@');
  if (user.length <= 2) {
    return `${user}***@${domain}`;
  }
  const visible = user.slice(0, 2);
  return `${visible}****@${domain}`;
}

module.exports = {
  requestCertificateOtp,
  verifyCertificateOtp,
  maskEmail
};
