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
    const { sightingId, userId } = JSON.parse(event.body || '{}');
    if (!sightingId || !userId) return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing required fields' }) };

    const db = await connectToDatabase(context);
    const userDoc = await db.collection('users').findOne({ uid: userId });
    if (!userDoc) return { statusCode: 404, headers, body: JSON.stringify({ error: 'User not found' }) };
    const sightingObjectId = new ObjectId(sightingId);
    const sighting = await db.collection('birdSightings').findOne({ _id: sightingObjectId });
    if (!sighting) return { statusCode: 404, headers, body: JSON.stringify({ error: 'Sighting not found' }) };
    if (sighting.userId !== userId && userDoc.isAdmin !== true) {
      return { statusCode: 403, headers, body: JSON.stringify({ error: 'Not authorized to delete this sighting' }) };
    }
    await db.collection('birdSightings').deleteOne({ _id: sightingObjectId });
    return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
  } catch (error) {
    console.error('Error deleting bird sighting:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Internal server error' }) };
  }
};