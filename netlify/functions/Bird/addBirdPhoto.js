const { connectToDatabase } = require('../General/db');
const { uploadFileToDrive } = require('../General/driveAPI');
const { uploadFileToImageKit } = require('../General/imageKitAPI');
const { ObjectId } = require('mongodb');
const path = require('path');

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  // Allow only POST
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    // Parse request
    const requestData = JSON.parse(event.body);
    const { fileData, fileName, contentType, birdId, userId, location, dateOfCapture } = requestData;

    // Validate request
    if (!fileData || !fileName || !contentType || !birdId || !userId || !location || !dateOfCapture) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing required fields' }) };
    }

    if (fileData.length < 100) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'File data appears to be corrupted or empty' }) };
    }

    // Database
    const db = await connectToDatabase(context);

    // Get user data from MongoDB
    const userDoc = await db.collection('users').findOne({ uid: userId });
    if (!userDoc) {
      return { statusCode: 404, headers, body: JSON.stringify({ error: 'User not found' }) };
    }

    // Check if bird exists
    let birdObjectId;
    try {
      birdObjectId = new ObjectId(birdId);
    } catch (e) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid bird ID format' }) };
    }

    const birdDoc = await db.collection('birds').findOne({ _id: birdObjectId });
    if (!birdDoc) {
      return { statusCode: 404, headers, body: JSON.stringify({ error: 'Bird not found' }) };
    }

    // Google Drive upload
    const ext = path.extname(fileName);
    const now = new Date();
    const timestamp =
      now.getFullYear().toString() +
      String(now.getMonth() + 1).padStart(2, '0') +
      String(now.getDate()).padStart(2, '0') +
      String(now.getHours()).padStart(2, '0') +
      String(now.getMinutes()).padStart(2, '0') +
      String(now.getSeconds()).padStart(2, '0');

    const renamedFileName = `${birdDoc.commonCode}_${userDoc.username}_${timestamp}${ext}`;
    const driveFileId = await uploadFileToDrive(fileData, renamedFileName, contentType, process.env.GOOGLE_DRIVE_BIRDS_ID, birdDoc.commonName);

    // ImageKit Upload
    const { imagekitFileId, imagekitFilePath } = await uploadFileToImageKit(fileData, fileName, birdDoc.commonCode);

    // Save to MongoDB Photos collection
    const photoResult = await db.collection('photos').insertOne({
      birdId: birdObjectId,
      driveFileId,
      imagekitFileId,
      imagekitFilePath,
      location,
      dateOfCapture: new Date(dateOfCapture),
      userId, // Referencing user by UID
      addedAt: new Date(),
    });

    // Update bird's photo count and potentially featured photo
    const updateQuery = { $inc: { photoCount: 1 } };
    if (!birdDoc.featuredPhoto) {
      updateQuery.$set = { featuredPhoto: imagekitFilePath };
    }
    await db.collection('birds').updateOne({ _id: birdObjectId }, updateQuery);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        photoId: photoResult.insertedId.toString(),
        location: location,
        dateOfCapture: dateOfCapture,
        username: userDoc.username,
        imagekitFilePath: imagekitFilePath,
        driveFileId: driveFileId,
      }),
    };

  } catch (error) {
    console.error('Error uploading photo:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Internal server error', details: error.message }) };
  }
};
