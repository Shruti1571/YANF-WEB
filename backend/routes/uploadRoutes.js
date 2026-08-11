const express = require('express');
const router = express.Router();
const multer = require('multer');
const { Readable } = require('stream');
const jwt = require('jsonwebtoken');
const { getDriveClient } = require('../config/driveConfig');

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

function authAdmin(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Access denied. Token required.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const jwtSecret = process.env.JWT_SECRET || 'yanf_secret_jwt_key_2026';
    const decoded = jwt.verify(token, jwtSecret);
    req.user = decoded;
    next();
  } catch (ex) {
    res.status(401).json({ error: 'Invalid authentication token.' });
  }
}

// POST /api/upload — Upload image file to Google Drive API
router.post('/', authAdmin, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file uploaded.' });
    }

    const drive = getDriveClient();
    if (!drive) {
      // Fallback dev response if Google Drive credentials are not set up yet
      return res.json({
        url: `https://images.unsplash.com/photo-1541872703-74c5e44368f9?q=80&w=1000&auto=format&fit=crop`,
        driveFileId: 'mock_drive_id_' + Date.now(),
        message: 'Dev fallback image returned (Google Drive credentials not set in env).'
      });
    }

    const folderId = process.env.GDRIVE_FOLDER_ID;
    const fileStream = Readable.from(req.file.buffer);

    const fileMetadata = {
      name: `YANF_Blog_${Date.now()}_${req.file.originalname}`,
      parents: folderId ? [folderId] : []
    };

    const media = {
      mimeType: req.file.mimetype,
      body: fileStream
    };

    const response = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: 'id, webViewLink, webContentLink'
    });

    const fileId = response.data.id;

    // Set file permission to public reader
    await drive.permissions.create({
      fileId: fileId,
      requestBody: {
        role: 'reader',
        type: 'anyone'
      }
    });

    // Public thumbnail / direct CDN image link format
    const directImageUrl = `https://lh3.googleusercontent.com/d/${fileId}`;

    res.json({
      url: directImageUrl,
      driveFileId: fileId,
      webViewLink: response.data.webViewLink
    });
  } catch (error) {
    console.error('Google Drive upload error:', error);
    res.status(500).json({ error: 'Failed to upload image to Google Drive API.' });
  }
});

module.exports = router;
