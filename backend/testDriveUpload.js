const fs = require('fs');
const path = require('path');
require('dotenv').config();

const { getDriveClient } = require('./config/driveConfig');

async function testUpload() {
  console.log('🚀 Testing Google Drive API upload...');

  const drive = getDriveClient();
  if (!drive) {
    console.error('❌ Drive client failed to initialize. Check your .env GDRIVE_* settings.');
    return;
  }

  const filePath = path.join(__dirname, '..', 'Screenshot 2025-11-24 230334.png');
  if (!fs.existsSync(filePath)) {
    console.error('❌ Screenshot file not found at:', filePath);
    return;
  }

  const folderId = process.env.GDRIVE_FOLDER_ID;
  console.log(`📁 Target Google Drive Folder ID: ${folderId}`);

  try {
    const fileStream = fs.createReadStream(filePath);

    const fileMetadata = {
      name: `YANF_Test_${Date.now()}_Screenshot.png`,
      parents: folderId ? [folderId] : []
    };

    const media = {
      mimeType: 'image/png',
      body: fileStream
    };

    console.log('⏳ Uploading image to Google Drive API...');
    const response = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: 'id, webViewLink, webContentLink'
    });

    const fileId = response.data.id;
    console.log(`✅ Upload Successful! File ID: ${fileId}`);
    console.log(`🔗 Web View Link: ${response.data.webViewLink}`);

    // Set permission to public reader
    try {
      await drive.permissions.create({
        fileId: fileId,
        requestBody: {
          role: 'reader',
          type: 'anyone'
        }
      });
      const directImageUrl = `https://lh3.googleusercontent.com/d/${fileId}`;
      console.log(`🌐 Public Direct CDN Image URL: ${directImageUrl}`);
    } catch (permErr) {
      console.warn('⚠️ Could not set public permission:', permErr.message);
    }

  } catch (error) {
    console.error('❌ Upload Failed:', error.message);
    if (error.response && error.response.data) {
      console.error('Details:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testUpload();
