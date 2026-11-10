const { ObjectId } = require('mongodb');
const { connectToDatabase } = require('./db');
const { uploadFileToImageKit, deleteFileFromImageKit } = require('./imageKitAPI');
const { getAuthenticatedUserId } = require('../firebaseAdmin');
const path = require('path');

exports.handler = async (event, context) => {
  let db;
  let imagekitFileId;
  let photoId;
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };

  try {
    const userId = await getAuthenticatedUserId(event);
    if (!userId) {
      return { statusCode: 401, headers, body: JSON.stringify({ error: 'Authentication required' }) };
    }

    let requestData;
    try {
      requestData = JSON.parse(event.body || '{}');
    } catch {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid JSON payload' }) };
    }

    const { fileData, fileName, contentType } = requestData;
    if (
      typeof fileData !== 'string' ||
      !fileData ||
      typeof fileName !== 'string' ||
      !fileName ||
      !['image/jpeg', 'image/png', 'image/webp'].includes(contentType)
    ) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'A valid image is required' }) };
    }
    if (fileData.length > 5_000_000) {
      return { statusCode: 413, headers, body: JSON.stringify({ error: 'Image is too large' }) };
    }

    db = await connectToDatabase(context);
    const user = await db.collection('users').findOne({ uid: userId });
    if (!user) {
      return { statusCode: 404, headers, body: JSON.stringify({ error: 'User not found' }) };
    }

    const usernameFolder = String(user.username || userId).replace(/[^a-zA-Z0-9._-]/g, '') || userId;
    const originalFileName = path.basename(fileName).replace(/[^a-zA-Z0-9._-]/g, '_');
    const uniqueFileName = `${Date.now()}-${originalFileName}`;
    const uploadedFile = await uploadFileToImageKit(
      fileData,
      uniqueFileName,
      `@${usernameFolder}`
    );
    imagekitFileId = uploadedFile.imagekitFileId;
    const { imagekitFilePath } = uploadedFile;

    const addedAt = new Date();
    photoId = new ObjectId();
    await db.collection('userPhotos').insertOne({
      _id: photoId,
      id: photoId.toString(),
      userId,
      imagekitFileId,
      imagekitFilePath,
      addedAt,
    });

    const updateResult = await db.collection('users').updateOne(
      { uid: userId },
      { $set: { userPhoto: imagekitFilePath } }
    );
    if (!updateResult.matchedCount) {
      throw Object.assign(new Error('User not found'), { statusCode: 404 });
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, userPhoto: imagekitFilePath }),
    };
  } catch (error) {
    console.error('Error uploading user photo:', error);
    if (photoId && db) {
      try {
        await db.collection('userPhotos').deleteOne({ _id: photoId });
      } catch (cleanupError) {
        console.error('Error cleaning up user photo record:', cleanupError);
      }
    }
    if (imagekitFileId) {
      try {
        await deleteFileFromImageKit(imagekitFileId);
      } catch (cleanupError) {
        console.error('Error cleaning up uploaded user photo:', cleanupError);
      }
    }
    const statusCode = error.statusCode || 500;
    return {
      statusCode,
      headers,
      body: JSON.stringify({ error: statusCode === 500 ? 'Internal server error' : error.message }),
    };
  }
};
