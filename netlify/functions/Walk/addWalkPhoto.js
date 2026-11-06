const { connectToDatabase } = require('../General/db');
const { uploadFileToDrive } = require('../General/driveAPI');
const { uploadFileToImageKit } = require('../General/imageKitAPI');
const { ObjectId } = require('mongodb');

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
    const { walkId, experience, fileData, fileName, contentType, userId } = requestData;

    if (!walkId || !fileData || !userId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing required fields' }),
      };
    }

    const db = await connectToDatabase(context);

    const user = await db.collection('users').findOne({ uid: userId });
    if (!user) {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ error: 'User must be authenticated' })
      };
    }

    // Lookup walk by _id or walkCode
    let walkQuery = { walkCode: walkId };
    if (ObjectId.isValid(walkId)) {
      walkQuery = { $or: [{ _id: new ObjectId(walkId) }, { walkCode: walkId }] };
    }
    const walk = await db.collection('walks').findOne(walkQuery);
    if (!walk) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Walk not found' }),
      };
    }

    const folderId = process.env.GOOGLE_DRIVE_WALKS_ID || process.env.GOOGLE_DRIVE_FOLDER_ID;
    if (!folderId) {
      throw new Error('Google Drive folder ID for walks is not configured');
    }

    const driveFileId = await uploadFileToDrive(fileData, fileName, contentType, folderId);
    const { imagekitFileId, imagekitFilePath } = await uploadFileToImageKit(fileData, fileName, 'walks');

    const result = await db.collection('walkPhotos').insertOne({
      walkId: walk._id.toString(),
      driveFileId,
      imagekitFileId,
      imagekitFilePath,
      experience: experience || '',
      userId,
      addedAt: new Date()
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        photoId: result.insertedId.toString(),
        imagekitFilePath,
        driveFileId,
        username: user.username
      }),
    };
  } catch (error) {
    console.error('Error adding walkPhotos photo:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error', details: error.message }),
    };
  }
};