const { connectToDatabase } = require('./db');
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
    const authenticatedUserId = await getAuthenticatedUserId(event);
    if (!authenticatedUserId) {
      return { statusCode: 401, headers, body: JSON.stringify({ error: 'Authentication required' }) };
    }

    let requestData;
    try {
      requestData = JSON.parse(event.body || '{}');
    } catch {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid JSON payload' }) };
    }

    const { userId, userType } = requestData;
    if (typeof userId !== 'string' || !userId || ![0, 1, 2].includes(userType)) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid user or user type' }) };
    }

    const db = await connectToDatabase(context);
    const adminUser = await db.collection('users').findOne({ uid: authenticatedUserId });
    if (!adminUser || adminUser.userType !== 0) {
      return { statusCode: 403, headers, body: JSON.stringify({ error: 'Admin access required' }) };
    }

    const result = await db.collection('users').updateOne(
      { uid: userId },
      { $set: { userType } }
    );
    if (!result.matchedCount) {
      return { statusCode: 404, headers, body: JSON.stringify({ error: 'User not found' }) };
    }

    return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
  } catch (error) {
    console.error('Error updating user type:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Internal server error' }) };
  }
};
