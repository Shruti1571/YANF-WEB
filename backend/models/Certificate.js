const mongoose = require('mongoose');

const certificateSchema = new mongoose.Schema({
  certificateNumber: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
    index: true
  },
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true,
    index: true
  },
  qrCodeDataUrl: {
    type: String,
    default: ''
  },
  // 5 Participant fields (blank pre-event; populated post-event)
  recipientName: {
    type: String,
    trim: true,
    default: ''
  },
  recipientEmail: {
    type: String,
    trim: true,
    lowercase: true,
    default: ''
  },
  position: {
    type: String,
    trim: true,
    default: ''
  },
  portfolio: {
    type: String,
    trim: true,
    default: ''
  },
  committee: {
    type: String,
    trim: true,
    default: ''
  },
  status: {
    type: String,
    enum: ['pre_event_blank', 'active', 'revoked'],
    default: 'pre_event_blank',
    index: true
  },
  downloadCount: {
    type: Number,
    default: 0
  },
  activatedAt: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

certificateSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  // Automatically activate when all 5 participant fields are filled
  if (this.recipientName && this.recipientEmail && this.position && this.portfolio && this.committee) {
    if (this.status === 'pre_event_blank') {
      this.status = 'active';
      this.activatedAt = Date.now();
    }
  }
  if (typeof next === 'function') next();
});

module.exports = mongoose.models.Certificate || mongoose.model('Certificate', certificateSchema);
