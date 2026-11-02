const mongoose = require('mongoose');

// A photo published to the public Gallery page.
// The image itself lives on Google Drive (uploaded via /api/upload); this record
// says which section and event it belongs to and how to caption it.
const galleryPhotoSchema = new mongoose.Schema({
  url: { type: String, required: true, trim: true },
  driveFileId: { type: String, trim: true },
  caption: { type: String, trim: true, default: '' },
  altText: { type: String, required: true, trim: true },
  section: {
    type: String,
    enum: ['committee', 'ceremonies', 'behind-the-scenes'],
    default: 'committee'
  },
  eventName: { type: String, required: true, trim: true },
  year: { type: Number },
  order: { type: Number, default: 0 },
  published: { type: Boolean, default: true },
  createdBy: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

galleryPhotoSchema.index({ published: 1, year: -1, eventName: 1, order: 1 });

module.exports = mongoose.models.GalleryPhoto || mongoose.model('GalleryPhoto', galleryPhotoSchema);
