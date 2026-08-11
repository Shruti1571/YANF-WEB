const mongoose = require('mongoose');

const mediaSchema = new mongoose.Schema({
  url: { type: String, required: true },
  driveFileId: { type: String },
  title: { type: String },
  altText: { type: String, required: true },
  caption: { type: String },
  description: { type: String }
}, { _id: false });

const blogSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
  metaTitle: { type: String },
  metaDescription: { type: String },
  metaKeywords: { type: String },
  category: { type: String, default: 'Diplomacy' },
  author: { type: String, default: 'YANF Editorial' },
  readTime: { type: String, default: '4 min read' },
  summary: { type: String, required: true },
  content: { type: String, required: true },
  coverImage: mediaSchema,
  status: { type: String, enum: ['published', 'draft'], default: 'published' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.models.Blog || mongoose.model('Blog', blogSchema);
