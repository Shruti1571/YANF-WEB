const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  passwordHash: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  otp: {
    type: String
  },
  otpExpires: {
    type: Date
  },
  role: {
    type: String,
    enum: ['superadmin', 'admin'],
    default: 'admin'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  permissions: {
    blogs: { type: Boolean, default: true },
    media: { type: Boolean, default: true },
    certificates: { type: Boolean, default: false },
    gallery: { type: Boolean, default: false },
    hallOfFame: { type: Boolean, default: false },
    users: { type: Boolean, default: false }
  },
  lastLoginAt: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.models.User || mongoose.model('User', userSchema);
