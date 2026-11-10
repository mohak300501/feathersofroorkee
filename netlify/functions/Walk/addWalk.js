const { connectToDatabase } = require('../General/db');
const { uploadFileToDrive } = require('../General/driveAPI');
const { uploadFileToImageKit } = require('../General/imageKitAPI');

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    let requestData;
    try {
      requestData = JSON.parse(event.body || '{}');
    } catch {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid JSON payload' }) };
    }
    const { title, info, datetime, location, mapPin, limit, fileData, fileName, contentType, userId } = requestData;

    if (!title || !info || !datetime || !location || !fileData || !userId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing required fields' }),
      };
    }

    const parsedLimit = parseInt(limit, 10);
    const participantLimit = (!isNaN(parsedLimit) && parsedLimit > 0) ? parsedLimit : 25;

    const d = new Date(datetime);
    if (isNaN(d.getTime())) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid datetime format' }),
      };
    }

    const db = await connectToDatabase(context);

    const user = await db.collection('users').findOne({ uid: userId });
    if (!user || user.userType !== 0) {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ error: 'Admin privileges required' })
      };
    }

    const folderId = process.env.GOOGLE_DRIVE_WALKS_ID;
    if (!folderId) {
      throw new Error('Google Drive folder ID for walks is not configured');
    }

    const driveFileId = await uploadFileToDrive(fileData, fileName, contentType, folderId);
    const { imagekitFileId, imagekitFilePath } = await uploadFileToImageKit(fileData, fileName, 'walks');

    const code = `w_${String(d.getDate()).padStart(2, '0')}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getFullYear()).slice(-2)}_${String(d.getHours()).padStart(2, '0')}${String(d.getMinutes()).padStart(2, '0')}`;

    const walkResult = await db.collection('walks').insertOne({
      walkCode: code,
      title,
      info,
      datetime: d,
      location,
      mapPin: mapPin || '',
      limit: participantLimit,
      featuredPhoto: imagekitFilePath,
      addedBy: userId,
      addedAt: new Date()
    });

    await db.collection('walkPhotos').insertOne({
      walkId: walkResult.insertedId.toString(),
      driveFileId,
      imagekitFileId,
      imagekitFilePath,
      experience: "Walk Poster",
      userId,
      addedAt: new Date()
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, walkCode: code, walkId: walkResult.insertedId.toString() }),
    };
  } catch (error) {
    console.error('Error adding walk:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error', details: error.message }),
    };
  }
};