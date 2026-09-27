const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Certificate = require('../models/Certificate');
const Event = require('../models/Event');
const { authAdmin } = require('../config/authMiddleware');
const { requestCertificateOtp, verifyCertificateOtp, maskEmail } = require('../services/certificateOtpService');
const { generateQrDataUrl } = require('../services/qrService');

// 1. GET /api/certificates/verify/:certificateNumber - Public verification lookup
router.get('/verify/:certificateNumber', async (req, res) => {
  try {
    const rawNumber = req.params.certificateNumber.trim().toUpperCase();
    const certificate = await Certificate.findOne({ certificateNumber: rawNumber }).populate('eventId');

    if (!certificate) {
      return res.status(404).json({
        found: false,
        error: 'Certificate not found. Please verify the Certificate ID.'
      });
    }

    const event = certificate.eventId;
    const isPreEvent = certificate.status === 'pre_event_blank';

    res.json({
      found: true,
      certificate: {
        _id: certificate._id,
        certificateNumber: certificate.certificateNumber,
        status: certificate.status,
        isPreEventBlank: isPreEvent,
        recipientName: certificate.recipientName,
        recipientEmailMasked: maskEmail(certificate.recipientEmail),
        position: certificate.position,
        portfolio: certificate.portfolio,
        committee: certificate.committee,
        qrCodeDataUrl: certificate.qrCodeDataUrl,
        activatedAt: certificate.activatedAt,
        downloadCount: certificate.downloadCount
      },
      event: {
        _id: event ? event._id : null,
        title: event ? event.title : 'YANF Assembly',
        eventDate: event ? event.eventDate : null,
        venue: event ? event.venue : '',
        schoolName: event ? event.schoolName : '',
        schoolLogos: event ? event.schoolLogos : [],
        yanfLogo: event ? event.yanfLogo : null,
        schoolSignatories: event ? event.schoolSignatories : [],
        yanfSignatory: event ? event.yanfSignatory : null
      }
    });
  } catch (error) {
    console.error('Error verifying certificate:', error);
    res.status(500).json({ error: 'Failed to verify certificate.' });
  }
});

// 2. POST /api/certificates/search - Public search by Name + Email
router.post('/search', async (req, res) => {
  try {
    const { name, email } = req.body;
    if (!name || !email) {
      return res.status(400).json({ error: 'Both recipient name and email are required for search.' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const nameRegex = new RegExp(name.trim(), 'i');

    const certificates = await Certificate.find({
      recipientEmail: cleanEmail,
      recipientName: nameRegex,
      status: 'active'
    }).populate('eventId');

    if (!certificates.length) {
      return res.status(404).json({
        found: false,
        error: 'No active certificates found matching the provided name and email address.'
      });
    }

    const results = certificates.map(cert => ({
      _id: cert._id,
      certificateNumber: cert.certificateNumber,
      recipientName: cert.recipientName,
      position: cert.position,
      portfolio: cert.portfolio,
      committee: cert.committee,
      eventTitle: cert.eventId ? cert.eventId.title : 'YANF Event',
      eventDate: cert.eventId ? cert.eventId.eventDate : null
    }));

    res.json({ found: true, certificates: results });
  } catch (error) {
    console.error('Error searching certificates:', error);
    res.status(500).json({ error: 'Failed to search certificates.' });
  }
});

// 3. POST /api/certificates/:id/request-otp - Request OTP for PDF download
router.post('/:id/request-otp', async (req, res) => {
  try {
    const certificate = await Certificate.findById(req.params.id).populate('eventId');
    if (!certificate) {
      return res.status(404).json({ error: 'Certificate not found.' });
    }

    if (certificate.status !== 'active' || !certificate.recipientEmail) {
      return res.status(400).json({
        error: 'This certificate has not yet been activated with an authorized recipient email.'
      });
    }

    const result = await requestCertificateOtp(certificate);
    res.json({
      message: `A 6-digit verification code has been dispatched to ${result.maskedEmail}.`,
      maskedEmail: result.maskedEmail,
      expiresInSeconds: result.expiresInSeconds
    });
  } catch (error) {
    console.error('Error requesting certificate OTP:', error);
    res.status(error.statusCode || 500).json({
      error: error.message || 'Failed to send verification code.',
      retryAfter: error.retryAfter
    });
  }
});

// 4. POST /api/certificates/:id/verify-otp - Validate OTP and issue short-lived download token
router.post('/:id/verify-otp', async (req, res) => {
  try {
    const { otp } = req.body;
    if (!otp) {
      return res.status(400).json({ error: 'Passcode is required.' });
    }

    const certificate = await Certificate.findById(req.params.id);
    if (!certificate) {
      return res.status(404).json({ error: 'Certificate not found.' });
    }

    await verifyCertificateOtp(certificate._id, certificate.recipientEmail, otp);

    // Issue short-lived download authorization token (15 mins)
    const jwtSecret = process.env.JWT_SECRET || 'yanf_secret_jwt_key_2026';
    const downloadToken = jwt.sign(
      {
        certId: certificate._id,
        certificateNumber: certificate.certificateNumber,
        authorizedForDownload: true
      },
      jwtSecret,
      { expiresIn: '15m' }
    );

    // Increment download count
    certificate.downloadCount = (certificate.downloadCount || 0) + 1;
    await certificate.save();

    res.json({
      success: true,
      message: 'Authentication successful. You may now download your official certificate.',
      downloadToken
    });
  } catch (error) {
    console.error('Error verifying certificate OTP:', error);
    res.status(error.statusCode || 400).json({
      error: error.message || 'Passcode verification failed.'
    });
  }
});

// 5. PUT /api/certificates/:id - Admin updates the 5 participant fields
router.put('/:id', authAdmin, async (req, res) => {
  try {
    const certificate = await Certificate.findById(req.params.id);
    if (!certificate) {
      return res.status(404).json({ error: 'Certificate not found.' });
    }

    const {
      certificateNumber,
      recipientName,
      recipientEmail,
      position,
      portfolio,
      committee,
      status
    } = req.body;

    // Check certificateNumber uniqueness if modified
    if (certificateNumber && certificateNumber.trim().toUpperCase() !== certificate.certificateNumber) {
      const cleanNum = certificateNumber.trim().toUpperCase();
      const existing = await Certificate.findOne({ certificateNumber: cleanNum });
      if (existing && existing._id.toString() !== certificate._id.toString()) {
        return res.status(409).json({ error: `Certificate ID ${cleanNum} is already in use.` });
      }
      certificate.certificateNumber = cleanNum;
      // Re-generate QR for the new ID
      certificate.qrCodeDataUrl = await generateQrDataUrl(cleanNum);
    }

    if (recipientName !== undefined) certificate.recipientName = recipientName.trim();
    if (recipientEmail !== undefined) certificate.recipientEmail = recipientEmail.trim().toLowerCase();
    if (position !== undefined) certificate.position = position.trim();
    if (portfolio !== undefined) certificate.portfolio = portfolio.trim();
    if (committee !== undefined) certificate.committee = committee.trim();
    if (status !== undefined) certificate.status = status;

    // Auto-activate if all 5 fields are filled
    if (
      certificate.recipientName &&
      certificate.recipientEmail &&
      certificate.position &&
      certificate.portfolio &&
      certificate.committee
    ) {
      certificate.status = 'active';
      if (!certificate.activatedAt) {
        certificate.activatedAt = Date.now();
      }
    }

    await certificate.save();
    res.json({ message: 'Certificate updated successfully.', certificate });
  } catch (error) {
    console.error('Error updating certificate:', error);
    res.status(500).json({ error: error.message || 'Failed to update certificate.' });
  }
});

// 6. DELETE /api/certificates/:id - Admin deletes a certificate
router.delete('/:id', authAdmin, async (req, res) => {
  try {
    const cert = await Certificate.findByIdAndDelete(req.params.id);
    if (!cert) {
      return res.status(404).json({ error: 'Certificate not found.' });
    }
    res.json({ message: 'Certificate deleted successfully.' });
  } catch (error) {
    console.error('Error deleting certificate:', error);
    res.status(500).json({ error: 'Failed to delete certificate.' });
  }
});

module.exports = router;
