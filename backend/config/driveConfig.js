const { google } = require('googleapis');

function getDriveClient() {
  const clientId = process.env.GDRIVE_CLIENT_ID;
  const clientSecret = process.env.GDRIVE_CLIENT_SECRET;
  const refreshToken = process.env.GDRIVE_REFRESH_TOKEN;

  // Option A: OAuth2 Client (User Credentials - No Org Policy restrictions)
  if (clientId && clientSecret && refreshToken) {
    const oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      'https://developers.google.com/oauthplayground'
    );

    oauth2Client.setCredentials({ refresh_token: refreshToken });
    return google.drive({ version: 'v3', auth: oauth2Client });
  }

  // Option B: Service Account JWT
  const clientEmail = process.env.GDRIVE_CLIENT_EMAIL;
  let privateKey = process.env.GDRIVE_PRIVATE_KEY;

  if (clientEmail && privateKey && !privateKey.includes('YOUR_PRIVATE_KEY_HERE')) {
    privateKey = privateKey.replace(/\\n/g, '\n');
    const auth = new google.auth.JWT(
      clientEmail,
      null,
      privateKey,
      ['https://www.googleapis.com/auth/drive.file', 'https://www.googleapis.com/auth/drive']
    );
    return google.drive({ version: 'v3', auth });
  }

  console.warn('⚠️ Google Drive API credentials missing or unconfigured in process.env.');
  return null;
}

module.exports = { getDriveClient };
