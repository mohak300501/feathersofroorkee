const { connectToDatabase } = require('../General/db');
const { ObjectId } = require('mongodb');

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'PUT, OPTIONS',
  };
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };
  if (event.httpMethod !== 'PUT') return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };

  try {
    const { photoId, userId, mapCoords, location, info = '', datetimeOfSighting } = JSON.parse(event.body || '{}');
    if (!photoId || !userId || !Array.isArray(mapCoords) || mapCoords.length !== 2 || !location || !datetimeOfSighting) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing required fields' }) };
    }
    const [lat, lng] = mapCoords.map(Number);
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid coordinates' }) };
    }

    const db = await connectToDatabase(context);
    const userDoc = await db.collection('users').findOne({ uid: userId });
    if (!userDoc) return { statusCode: 404, headers, body: JSON.stringify({ error: 'User not found' }) };
    const photoObjectId = new ObjectId(photoId);
    const photoDoc = await db.collection('birdPhotos').findOne({ _id: photoObjectId });
    if (!photoDoc) return { statusCode: 404, headers, body: JSON.stringify({ error: 'Photo not found' }) };
    if (photoDoc.userId !== userId && userDoc.isAdmin !== true) return { statusCode: 403, headers, body: JSON.stringify({ error: 'Not authorized to edit this photo' }) };

    const result = await db.collection('birdSightings').updateOne(
      { photoId: photoId },
      { $set: { mapCoords: [lat, lng], location, info, datetimeOfSighting: new Date(datetimeOfSighting), updatedAt: new Date() } }
    );
    if (!result.matchedCount) {
      return { statusCode: 404, headers, body: JSON.stringify({ error: 'Photo sighting not found' }) };
    }
    return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
  } catch (error) {
    console.error('Error editing photo info:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Internal server error' }) };
  }
};
