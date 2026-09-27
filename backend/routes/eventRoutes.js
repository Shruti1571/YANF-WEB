const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const Certificate = require('../models/Certificate');
const { authAdmin } = require('../config/authMiddleware');
const { generateUniqueCertificateNumber, generateQrDataUrl, streamQrZipArchive } = require('../services/qrService');

// 1. GET /api/events - List all events with certificate statistics
router.get('/', authAdmin, async (req, res) => {
  try {
    const events = await Event.find().sort({ createdAt: -1 });
    
    // Attach certificate count statistics
    const eventsWithStats = await Promise.all(
      events.map(async (event) => {
        const totalCerts = await Certificate.countDocuments({ eventId: event._id });
        const activeCerts = await Certificate.countDocuments({ eventId: event._id, status: 'active' });
        const blankCerts = await Certificate.countDocuments({ eventId: event._id, status: 'pre_event_blank' });
        return {
          ...event.toObject(),
          stats: {
            total: totalCerts,
            active: activeCerts,
            blank: blankCerts
          }
        };
      })
    );

    res.json({ events: eventsWithStats });
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ error: 'Failed to retrieve events.' });
  }
});

// 2. GET /api/events/:id - Get single event with its certificates
router.get('/:id', authAdmin, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ error: 'Event not found.' });
    }

    const certificates = await Certificate.find({ eventId: event._id }).sort({ createdAt: 1 });
    res.json({ event, certificates });
  } catch (error) {
    console.error('Error fetching single event:', error);
    res.status(500).json({ error: 'Failed to retrieve event.' });
  }
});

// 3. POST /api/events - Create new event (supports incremental saving)
router.post('/', authAdmin, async (req, res) => {
  try {
    const {
      title,
      eventDate,
      venue,
      schoolName,
      schoolLogos,
      yanfLogo,
      schoolSignatories,
      yanfSignatory,
      status
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Event title is required.' });
    }

    const newEvent = new Event({
      title: title.trim(),
      eventDate: eventDate || null,
      venue: venue || '',
      schoolName: schoolName || '',
      schoolLogos: schoolLogos || [],
      yanfLogo: yanfLogo || undefined,
      schoolSignatories: schoolSignatories || [],
      yanfSignatory: yanfSignatory || undefined,
      status: status || 'draft'
    });

    await newEvent.save();
    res.status(201).json({ message: 'Event created successfully.', event: newEvent });
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({ error: error.message || 'Failed to create event.' });
  }
});

// 4. PUT /api/events/:id - Update existing event
router.put('/:id', authAdmin, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ error: 'Event not found.' });
    }

    const {
      title,
      eventDate,
      venue,
      schoolName,
      schoolLogos,
      yanfLogo,
      schoolSignatories,
      yanfSignatory,
      status
    } = req.body;

    if (title !== undefined) event.title = title.trim();
    if (eventDate !== undefined) event.eventDate = eventDate;
    if (venue !== undefined) event.venue = venue;
    if (schoolName !== undefined) event.schoolName = schoolName;
    if (schoolLogos !== undefined) event.schoolLogos = schoolLogos;
    if (yanfLogo !== undefined) event.yanfLogo = yanfLogo;
    if (schoolSignatories !== undefined) event.schoolSignatories = schoolSignatories;
    if (yanfSignatory !== undefined) event.yanfSignatory = yanfSignatory;
    if (status !== undefined) event.status = status;

    await event.save();
    res.json({ message: 'Event updated successfully.', event });
  } catch (error) {
    console.error('Error updating event:', error);
    res.status(500).json({ error: error.message || 'Failed to update event.' });
  }
});

// 5. DELETE /api/events/:id - Delete event and all its certificates
router.delete('/:id', authAdmin, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ error: 'Event not found.' });
    }

    await Certificate.deleteMany({ eventId: event._id });
    await Event.findByIdAndDelete(event._id);

    res.json({ message: 'Event and associated certificates deleted successfully.' });
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({ error: 'Failed to delete event.' });
  }
});

// 6. POST /api/events/:id/certificates/batch - Batch create N blank certificates
router.post('/:id/certificates/batch', authAdmin, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ error: 'Event not found.' });
    }

    const count = parseInt(req.body.count || 1, 10);
    if (isNaN(count) || count < 1 || count > 500) {
      return res.status(400).json({ error: 'Count must be a number between 1 and 500.' });
    }

    const createdCertificates = [];

    for (let i = 0; i < count; i++) {
      const certificateNumber = await generateUniqueCertificateNumber();
      const qrCodeDataUrl = await generateQrDataUrl(certificateNumber);

      const cert = new Certificate({
        certificateNumber,
        eventId: event._id,
        qrCodeDataUrl,
        recipientName: '',
        recipientEmail: '',
        position: '',
        portfolio: '',
        committee: '',
        status: 'pre_event_blank'
      });

      await cert.save();
      createdCertificates.push(cert);
    }

    res.status(201).json({
      message: `Successfully generated ${createdCertificates.length} certificates.`,
      certificates: createdCertificates
    });
  } catch (error) {
    console.error('Error in batch certificate generation:', error);
    res.status(500).json({ error: 'Failed to batch generate certificates.' });
  }
});

// 7. GET /api/events/:id/certificates/export-qrs - Export all QRs in a .ZIP archive
router.get('/:id/certificates/export-qrs', authAdmin, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ error: 'Event not found.' });
    }

    const certificates = await Certificate.find({ eventId: event._id });
    if (!certificates.length) {
      return res.status(400).json({ error: 'No certificates found for this event to export.' });
    }

    await streamQrZipArchive(certificates, res);
  } catch (error) {
    console.error('Error exporting QR zip:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to create QR ZIP archive.' });
    }
  }
});

module.exports = router;
