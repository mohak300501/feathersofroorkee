const { ObjectId } = require('mongodb');
const { connectToDatabase } = require('../General/db');
const { getAuthenticatedUserId } = require('../firebaseAdmin');

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, DELETE, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };
  if (event.httpMethod !== 'POST' && event.httpMethod !== 'DELETE') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    let requestData;
    try {
      requestData = JSON.parse(event.body || '{}');
    } catch {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid JSON payload' }) };
    }

    const { experienceId, userId } = requestData;
    if (!experienceId || !userId) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Experience ID and User ID are required' }) };
    }
    if (!ObjectId.isValid(experienceId)) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid experience ID' }) };
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
      return { statusCode: 404, headers, body: JSON.stringify({ error: 'Experience not found' }) };
    }

    if (experienceDoc.userId !== authenticatedUserId && user.userType !== 0) {
      return { statusCode: 403, headers, body: JSON.stringify({ error: 'Not authorized to delete this experience' }) };
    }

    await db.collection('walkExperiences').deleteOne({ _id: experienceObjectId });

    return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
  } catch (error) {
    console.error('Error deleting walk experience:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Internal server error' }) };
  }
};

