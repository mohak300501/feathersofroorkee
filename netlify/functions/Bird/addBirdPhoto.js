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
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };

  try {
    const { fileData, fileName, contentType, birdId, userId, location, mapCoords, info = '', datetimeOfSighting } = JSON.parse(event.body || '{}');
    if (!fileData || !fileName || !contentType || !birdId || !userId || !location || !datetimeOfSighting || !Array.isArray(mapCoords) || mapCoords.length !== 2) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing required fields' }) };
    }
    const coords = mapCoords.map(Number);
    if (!coords.every(Number.isFinite) || coords[0] < -90 || coords[0] > 90 || coords[1] < -180 || coords[1] > 180) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid coordinates' }) };
    }
    if (fileData.length < 100) return { statusCode: 400, headers, body: JSON.stringify({ error: 'File data appears to be corrupted or empty' }) };

    const db = await connectToDatabase(context);
    const userDoc = await db.collection('users').findOne({ uid: userId });
    if (!userDoc) return { statusCode: 404, headers, body: JSON.stringify({ error: 'User not found' }) };
    let birdObjectId;
    try { birdObjectId = new ObjectId(birdId); } catch { return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid bird ID format' }) }; }
    const birdDoc = await db.collection('birds').findOne({ _id: birdObjectId });
    if (!birdDoc) return { statusCode: 404, headers, body: JSON.stringify({ error: 'Bird not found' }) };

    const ext = path.extname(fileName);
    const now = new Date();
    const timestamp = now.getFullYear().toString() + String(now.getMonth() + 1).padStart(2, '0') + String(now.getDate()).padStart(2, '0') + String(now.getHours()).padStart(2, '0') + String(now.getMinutes()).padStart(2, '0') + String(now.getSeconds()).padStart(2, '0');
    const renamedFileName = `${birdDoc.commonCode}_${userDoc.username}_${timestamp}${ext}`;
    const driveFileId = await uploadFileToDrive(fileData, renamedFileName, contentType, process.env.GOOGLE_DRIVE_BIRDS_ID, birdDoc.commonName);
    const { imagekitFileId, imagekitFilePath } = await uploadFileToImageKit(fileData, fileName, birdDoc.commonCode);

    const photoResult = await db.collection('birdPhotos').insertOne({
      birdId: birdObjectId,
      driveFileId,
      imagekitFileId,
      imagekitFilePath,
      userId,
      addedAt: new Date(),
    });

    const sightingObjectId = new ObjectId();
    const sightingId = sightingObjectId.toString();
    const sightingResult = await db.collection('birdSightings').insertOne({
      _id: sightingObjectId,
      sightingId,
      birdId: birdObjectId,
      photoId: photoResult.insertedId.toString(),
      userId,
      mapCoords: coords,
      location,
      info,
      datetimeOfSighting: new Date(datetimeOfSighting),
      addedAt: new Date(),
    });

    const updateQuery = { $inc: { photoCount: 1 } };
    if (!birdDoc.featuredPhoto) updateQuery.$set = { featuredPhoto: imagekitFilePath };
    await db.collection('birds').updateOne({ _id: birdObjectId }, updateQuery);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        photoId: photoResult.insertedId.toString(),
        sightingId,
        username: userDoc.username,
        imagekitFilePath,
        imagekitFileId,
        driveFileId,
        hearts: 0,
      }),
    };
  } catch (error) {
    console.error('Error uploading photo:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Internal server error', details: error.message }) };
  }
};