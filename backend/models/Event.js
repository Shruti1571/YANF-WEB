const mongoose = require('mongoose');

const logoSchema = new mongoose.Schema({
  url: { type: String, required: true },
  publicId: { type: String },
  shape: { type: String, enum: ['square', 'rectangle'], default: 'square' },
  altText: { type: String, default: 'Event Logo' }
}, { _id: false });

const signatorySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  designation: { type: String, required: true, trim: true },
  signatureUrl: { type: String, required: true }
}, { _id: false });

const eventSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  eventDate: { type: Date },
  venue: { type: String, trim: true },
  schoolName: { type: String, trim: true },
  schoolLogos: {
    type: [logoSchema],
    validate: [val => val.length <= 2, '{PATH} exceeds limit of 2 school logos']
  },
  yanfLogo: {
    type: logoSchema,
    default: () => ({
      url: '/yanf-wall.svg',
      shape: 'square',
      altText: 'YANF Official Crest'
    })
  },
  schoolSignatories: {
    type: [signatorySchema],
    validate: [val => val.length <= 2, '{PATH} exceeds limit of 2 school signatories']
  },
  yanfSignatory: {
    type: signatorySchema,
    default: () => ({
      name: 'Secretariat General',
      designation: 'Secretary-General, YANF',
      signatureUrl: ''
    })
  },
  status: { type: String, enum: ['draft', 'active', 'completed'], default: 'draft' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

eventSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  if (typeof next === 'function') next();
});

module.exports = mongoose.models.Event || mongoose.model('Event', eventSchema);
