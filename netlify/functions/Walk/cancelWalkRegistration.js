const { connectToDatabase } = require('../General/db');
const { ObjectId } = require('mongodb');
const { getAuthenticatedUserId } = require('../firebaseAdmin');

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'DELETE, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'DELETE') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    let requestData;
    try {
      requestData = JSON.parse(event.body || '{}');
    } catch {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid JSON payload' }) };
    }

    const { walkId, userId } = requestData;
    if (!walkId || !userId) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing required fields' }) };
    }

    const authenticatedUserId = await getAuthenticatedUserId(event);
    if (!authenticatedUserId || authenticatedUserId !== userId) {
      return { statusCode: 401, headers, body: JSON.stringify({ error: 'Authentication required' }) };
    }

    const db = await connectToDatabase(context);
    const user = await db.collection('users').findOne({ uid: userId });
    if (!user) {
      return { statusCode: 403, headers, body: JSON.stringify({ error: 'User must be authenticated' }) };
    }

    let walkQuery = { walkCode: walkId };
    if (ObjectId.isValid(walkId)) {
      walkQuery = { $or: [{ _id: new ObjectId(walkId) }, { walkCode: walkId }] };
    }
    const walk = await db.collection('walks').findOne(walkQuery);
    if (!walk) {
      return { statusCode: 404, headers, body: JSON.stringify({ error: 'Walk not found' }) };
    }

    const walkRegistrationIds = [walk._id, walk._id.toString(), walk.walkCode];
    const registrations = db.collection('walkRegistrations');
    const registration = await registrations.findOne({
      walkId: { $in: walkRegistrationIds },
      userId
    });
    if (!registration) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Registration not found' }),
      };
    }

    const deleteResult = await registrations.deleteOne({ _id: registration._id });
    if (deleteResult.deletedCount === 0) {
      return {
        statusCode: 409,
        headers,
        body: JSON.stringify({ error: 'Registration has already been cancelled' }),
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true }),
    };
  } catch (error) {
    console.error('Error cancelling walk registration:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};
