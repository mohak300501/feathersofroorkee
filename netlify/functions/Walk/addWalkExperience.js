const { ObjectId } = require('mongodb');
const { connectToDatabase } = require('../General/db');
const { getAuthenticatedUserId } = require('../firebaseAdmin');

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };

  try {
    let requestData;
    try {
      requestData = JSON.parse(event.body || '{}');
    } catch {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid JSON payload' }) };
    }

    const { walkId, userId, info } = requestData;
    const trimmedInfo = typeof info === 'string' ? info.trim() : '';
    if (!walkId || !userId || !trimmedInfo) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Walk, user, and info are required' }) };
    }
    if (trimmedInfo.length > 2000) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Info must be 2000 characters or fewer' }) };
    }

    const authenticatedUserId = await getAuthenticatedUserId(event);
    if (!authenticatedUserId || authenticatedUserId !== userId) {
      return { statusCode: 401, headers, body: JSON.stringify({ error: 'Authentication required' }) };
    }

    const db = await connectToDatabase(context);
    const user = await db.collection('users').findOne({ uid: authenticatedUserId });
    if (!user) return { statusCode: 403, headers, body: JSON.stringify({ error: 'User must be authenticated' }) };

    const walkQuery = ObjectId.isValid(walkId)
      ? { $or: [{ _id: new ObjectId(walkId) }, { walkCode: walkId }] }
      : { walkCode: walkId };
    const walk = await db.collection('walks').findOne(walkQuery);
    if (!walk) return { statusCode: 404, headers, body: JSON.stringify({ error: 'Walk not found' }) };

    const addedAt = new Date();
    const result = await db.collection('walkExperiences').insertOne({
      userId: authenticatedUserId,
      walkId: walk._id.toString(),
      info: trimmedInfo,
      addedAt
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        experience: {
          id: result.insertedId.toString(),
          userId: authenticatedUserId,
          walkId: walk._id.toString(),
          info: trimmedInfo,
          username: user.username || 'Unknown user',
          addedAt
        }
      })
    };
  } catch (error) {
    console.error('Error adding walk info:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Internal server error' }) };
  }
};
