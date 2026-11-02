const express = require('express');
const router = express.Router();
const GalleryPhoto = require('../models/GalleryPhoto');
const { authAdmin } = require('../config/authMiddleware');

const SECTIONS = ['committee', 'ceremonies', 'behind-the-scenes'];
const EDITABLE = ['url', 'driveFileId', 'caption', 'altText', 'section', 'eventName', 'year', 'order', 'published'];

function pickEditable(body) {
  const out = {};
  EDITABLE.forEach((k) => {
    if (body[k] !== undefined) out[k] = body[k];
  });
  if (out.year !== undefined && out.year !== null && out.year !== '') out.year = Number(out.year);
  if (out.year === '' || Number.isNaN(out.year)) delete out.year;
  if (out.order !== undefined) out.order = Number(out.order) || 0;
  return out;
}

// GET /api/gallery — public: published photos, newest events first
router.get('/', async (req, res) => {
  try {
    const filter = { published: true };
    if (req.query.section && SECTIONS.includes(req.query.section)) filter.section = req.query.section;
    const photos = await GalleryPhoto.find(filter)
      .sort({ year: -1, eventName: 1, order: 1, createdAt: 1 })
      .select('url caption altText section eventName year order');
    res.json(photos);
  } catch (error) {
    console.error('Fetch gallery error:', error);
    res.status(500).json({ error: 'Failed to load the gallery.' });
  }
});

// GET /api/gallery/all — admin: every photo, including unpublished
router.get('/all', authAdmin, async (req, res) => {
  try {
    const photos = await GalleryPhoto.find({}).sort({ createdAt: -1 });
    res.json(photos);
  } catch (error) {
    console.error('Fetch all gallery error:', error);
    res.status(500).json({ error: 'Failed to load gallery photos.' });
  }
});

// POST /api/gallery — admin: publish a photo
router.post('/', authAdmin, async (req, res) => {
  try {
    const data = pickEditable(req.body || {});
    if (!data.url || !data.eventName) {
      return res.status(400).json({ error: 'A photo URL and an event name are required.' });
    }
    if (data.section && !SECTIONS.includes(data.section)) {
      return res.status(400).json({ error: 'Unknown gallery section.' });
    }
    if (!data.altText) data.altText = data.caption || `${data.eventName} photo`;
    const photo = await GalleryPhoto.create({ ...data, createdBy: req.user?.email || req.user?.id });
    res.status(201).json(photo);
  } catch (error) {
    console.error('Create gallery photo error:', error);
    res.status(500).json({ error: 'Failed to add the photo to the gallery.' });
  }
});

// PUT /api/gallery/:id — admin: edit caption, section, event, publish state
router.put('/:id', authAdmin, async (req, res) => {
  try {
    const data = pickEditable(req.body || {});
    if (data.section && !SECTIONS.includes(data.section)) {
      return res.status(400).json({ error: 'Unknown gallery section.' });
    }
    data.updatedAt = new Date();
    const photo = await GalleryPhoto.findByIdAndUpdate(req.params.id, data, { new: true, runValidators: true });
    if (!photo) return res.status(404).json({ error: 'Gallery photo not found.' });
    res.json(photo);
  } catch (error) {
    console.error('Update gallery photo error:', error);
    res.status(500).json({ error: 'Failed to update the photo.' });
  }
});

// DELETE /api/gallery/:id — admin: remove from the gallery (the Drive file is kept)
router.delete('/:id', authAdmin, async (req, res) => {
  try {
    const photo = await GalleryPhoto.findByIdAndDelete(req.params.id);
    if (!photo) return res.status(404).json({ error: 'Gallery photo not found.' });
    res.json({ success: true });
  } catch (error) {
    console.error('Delete gallery photo error:', error);
    res.status(500).json({ error: 'Failed to remove the photo.' });
  }
});

module.exports = router;
