const { google } = require('googleapis');
const https = require('https');

async function getDriveClient() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/drive'],
  });

  const authClient = await auth.getClient();
  const drive = google.drive({ version: 'v3', auth: authClient });

  return { drive, authClient };
}

async function getOrCreateSubfolder(drive, parentFolderId, folderName) {
  const query = [
    `name='${folderName.replace(/'/g, "\\\\'")}'`,
    `mimeType='application/vnd.google-apps.folder'`,
    `'${parentFolderId}' in parents`,
    'trashed=false'
  ].join(' and ');

  const existing = await drive.files.list({
    q: query,
    fields: 'files(id,name)',
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
  });

  if (existing.data.files.length > 0) {
    return existing.data.files[0].id;
  }

  const created = await drive.files.create({
    requestBody: {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [parentFolderId],
    },
    fields: 'id',
    supportsAllDrives: true,
  });

  return created.data.id;
}

async function uploadFileToDrive(fileData, fileName, contentType, parentFolderId, subfolderName) {
  const { drive, authClient } = await getDriveClient();

  const folderId = subfolderName
    ? await getOrCreateSubfolder(drive, parentFolderId, subfolderName)
    : parentFolderId;

  const fileBuffer = Buffer.from(fileData, 'base64');

  const fileMetadata = {
    name: fileName,
    parents: [folderId]
  };

  const accessToken = await authClient.getAccessToken();

  const sessionResponse = await new Promise((resolve, reject) => {
    const sessionOptions = {
      hostname: 'www.googleapis.com',
      path: '/upload/drive/v3/files?uploadType=resumable&fields=id,webViewLink&supportsAllDrives=true',
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken.token}`,
        'Content-Type': 'application/json',
        'X-Upload-Content-Type': contentType,
        'X-Upload-Content-Length': fileBuffer.length.toString(),
      },
    };

    const req = https.request(sessionOptions, (res) => {
      if (res.statusCode === 200) {
        resolve(res.headers.location);
      } else {
        let data = '';
        res.on('data', (c) => (data += c));
        res.on('end', () => reject(new Error(`Session creation failed: ${res.statusCode} - ${data}`)));
      }
    });

    req.on('error', reject);
    req.write(JSON.stringify(fileMetadata));
    req.end();
  });

  const uploadResponse = await new Promise((resolve, reject) => {
    const uploadUrl = new URL(sessionResponse);

    const uploadOptions = {
      hostname: uploadUrl.hostname,
      path: uploadUrl.pathname + uploadUrl.search,
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken.token}`,
        'Content-Type': contentType,
        'Content-Length': fileBuffer.length.toString(),
      },
    };

    const req = https.request(uploadOptions, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(JSON.parse(data));
        } else {
          reject(new Error(`Upload failed: ${res.statusCode} - ${data}`));
        }
      });
    });

    req.on('error', reject);
    req.write(fileBuffer);
    req.end();
  });

  return uploadResponse.id;
}

async function deleteFileFromDrive(fileId) {
  if (!fileId) return;

  const { drive } = await getDriveClient();

  await drive.files.delete({
    fileId,
    supportsAllDrives: true,
  });
}

module.exports = { uploadFileToDrive, deleteFileFromDrive };
