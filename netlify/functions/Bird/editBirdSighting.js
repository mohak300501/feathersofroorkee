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
    const { sightingId, userId, mapCoords, location, info = '', datetimeOfSighting } = JSON.parse(event.body || '{}');
    if (!sightingId || !userId || !Array.isArray(mapCoords) || mapCoords.length !== 2 || !location || !datetimeOfSighting) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing required fields' }) };
    }
    const [lat, lng] = mapCoords.map(Number);
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid coordinates' }) };
    }

    const db = await connectToDatabase(context);
    const userDoc = await db.collection('users').findOne({ uid: userId });
    if (!userDoc) return { statusCode: 404, headers, body: JSON.stringify({ error: 'User not found' }) };
    const sightingObjectId = new ObjectId(sightingId);
    const sighting = await db.collection('birdSightings').findOne({ _id: sightingObjectId });
    if (!sighting) return { statusCode: 404, headers, body: JSON.stringify({ error: 'Sighting not found' }) };

    const isAdmin = userDoc.isAdmin === true;
    if (sighting.userId !== userId && !isAdmin) {
      return { statusCode: 403, headers, body: JSON.stringify({ error: 'Not authorized to edit this sighting' }) };
    }

    await db.collection('birdSightings').updateOne(
      { _id: sightingObjectId },
      { $set: { mapCoords: [lat, lng], location, info, datetimeOfSighting: new Date(datetimeOfSighting), updatedAt: new Date() } }
    );
    return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
  } catch (error) {
    console.error('Error editing bird sighting:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Internal server error' }) };
  }
};
