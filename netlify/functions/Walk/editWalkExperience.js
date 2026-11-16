const { ObjectId } = require('mongodb');
const { connectToDatabase } = require('../General/db');
const { getAuthenticatedUserId } = require('../firebaseAdmin');

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'PUT, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };
  if (event.httpMethod !== 'PUT') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    let requestData;
    try {
      requestData = JSON.parse(event.body || '{}');
    } catch {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid JSON payload' }) };
    }

    const { experienceId, userId, info } = requestData;
    const trimmedInfo = typeof info === 'string' ? info.trim() : '';
    if (!experienceId || !userId || !trimmedInfo) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Info, user, and info text are required' }) };
    }
    if (!ObjectId.isValid(experienceId)) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid info ID' }) };
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
    if (!user) {
      return { statusCode: 403, headers, body: JSON.stringify({ error: 'User must be authenticated' }) };
    }

    const experienceObjectId = new ObjectId(experienceId);
    const experienceDoc = await db.collection('walkExperiences').findOne({ _id: experienceObjectId });
    if (!experienceDoc) {
      return { statusCode: 404, headers, body: JSON.stringify({ error: 'Info not found' }) };
    }
    if (experienceDoc.userId !== authenticatedUserId && user.userType !== 0) {
      return { statusCode: 403, headers, body: JSON.stringify({ error: 'Not authorized to edit this info' }) };
    }

    await db.collection('walkExperiences').updateOne(
      { _id: experienceObjectId },
      { $set: { info: trimmedInfo } }
    );

    return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
  } catch (error) {
    console.error('Error editing walk info:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Internal server error' }) };
  }
};
