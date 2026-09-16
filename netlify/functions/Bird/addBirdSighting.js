const { connectToDatabase } = require('../General/db');
const { ObjectId } = require('mongodb');

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };

  try {
    const { birdId, userId, photoId = '', mapCoords, location, info = '', datetimeOfSighting } = JSON.parse(event.body || '{}');
    if (!birdId || !userId || !Array.isArray(mapCoords) || mapCoords.length !== 2 || !location || !datetimeOfSighting) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing required fields' }) };
    }
    const [lat, lng] = mapCoords.map(Number);
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid coordinates' }) };
    }

    const db = await connectToDatabase(context);
    const userDoc = await db.collection('users').findOne({ uid: userId });
    if (!userDoc) return { statusCode: 404, headers, body: JSON.stringify({ error: 'User not found' }) };
    const birdObjectId = new ObjectId(birdId);
    const birdDoc = await db.collection('birds').findOne({ _id: birdObjectId });
    if (!birdDoc) return { statusCode: 404, headers, body: JSON.stringify({ error: 'Bird not found' }) };

    const sightingObjectId = new ObjectId();
    const sightingId = sightingObjectId.toString();
    const result = await db.collection('birdSightings').insertOne({
      _id: sightingObjectId,
      sightingId,
      birdId: birdObjectId,
      photoId: photoId || '',
      userId,
      mapCoords: [lat, lng],
      location,
      info,
      datetimeOfSighting: new Date(datetimeOfSighting),
      addedAt: new Date(),
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        sightingId,
        birdId,
        photoId: photoId || '',
        userId,
        username: userDoc.username,
        mapCoords: [lat, lng],
        location,
        info,
        datetimeOfSighting,
      }),
    };
  } catch (error) {
    console.error('Error adding bird sighting:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Internal server error' }) };
  }
};