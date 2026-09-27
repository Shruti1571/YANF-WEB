const QRCode = require('qrcode');
const archiver = require('archiver');
const Certificate = require('../models/Certificate');

// Unambiguous character set (no 0, O, 1, I, L)
const UNAMBIGUOUS_CHARS = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';

/**
 * Generate a random 4-character suffix
 */
function generateRandomSuffix(length = 4) {
  let result = '';
  for (let i = 0; i < length; i++) {
    result += UNAMBIGUOUS_CHARS.charAt(Math.floor(Math.random() * UNAMBIGUOUS_CHARS.length));
  }
  return result;
}

/**
 * Generate a unique Certificate ID (e.g. YANF-26-8K7Q)
 */
async function generateUniqueCertificateNumber() {
  const currentYear = new Date().getFullYear().toString().slice(-2);
  const prefix = `YANF-${currentYear}-`;

  let isUnique = false;
  let candidate = '';
  let attempts = 0;

  while (!isUnique && attempts < 20) {
    attempts++;
    candidate = `${prefix}${generateRandomSuffix(4)}`;
    const existing = await Certificate.findOne({ certificateNumber: candidate });
    if (!existing) {
      isUnique = true;
    }
  }

  if (!isUnique) {
    // Fallback to 5 chars if collision density is high
    candidate = `${prefix}${generateRandomSuffix(5)}`;
  }

  return candidate;
}

/**
 * Build verification URL for a given certificate number
 */
function getVerificationUrl(certificateNumber) {
  const frontendUrl = (process.env.FRONTEND_URL || 'https://yanfglobal.com').replace(/\/$/, '');
  return `${frontendUrl}/#page-certificates?id=${encodeURIComponent(certificateNumber)}`;
}

/**
 * Generate QR code as Base64 Data URL (Pure JavaScript)
 */
async function generateQrDataUrl(certificateNumber) {
  const targetUrl = getVerificationUrl(certificateNumber);
  return await QRCode.toDataURL(targetUrl, {
    errorCorrectionLevel: 'H',
    margin: 2,
    width: 320,
    color: {
      dark: '#000000',
      light: '#ffffff'
    }
  });
}

/**
 * Generate high-res QR code PNG buffer for printing/export (Pure JavaScript)
 */
async function generateQrBuffer(certificateNumber) {
  const targetUrl = getVerificationUrl(certificateNumber);
  return await QRCode.toBuffer(targetUrl, {
    errorCorrectionLevel: 'H',
    margin: 3,
    width: 600,
    color: {
      dark: '#000000',
      light: '#ffffff'
    }
  });
}

/**
 * Stream a zip archive of all QRs for a given event
 * @param {Array} certificates - List of certificate documents
 * @param {Response} res - Express HTTP response object
 */
async function streamQrZipArchive(certificates, res) {
  const archive = archiver('zip', {
    zlib: { level: 9 }
  });

  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', `attachment; filename="YANF-Certificates-QRs.zip"`);

  archive.pipe(res);

  for (const cert of certificates) {
    const pngBuffer = await generateQrBuffer(cert.certificateNumber);
    // Strict requirement: individual PNG files named strictly as {certificateNumber}.png
    const fileName = `${cert.certificateNumber}.png`;
    archive.append(pngBuffer, { name: fileName });
  }

  await archive.finalize();
}

module.exports = {
  generateUniqueCertificateNumber,
  getVerificationUrl,
  generateQrDataUrl,
  generateQrBuffer,
  streamQrZipArchive
};
