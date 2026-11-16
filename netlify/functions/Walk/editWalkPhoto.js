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

    const { photoId, userId, info, experience } = requestData;
    const photoInfo = typeof info === 'string' ? info : experience;
    if (!photoId || !userId || typeof photoInfo !== 'string') {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Photo, user, and info are required' }) };
    }
    if (!ObjectId.isValid(photoId)) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid photo ID' }) };
    }
    if (photoInfo.length > 2000) {
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

    const photoObjectId = new ObjectId(photoId);
    const photo = await db.collection('walkPhotos').findOne({ _id: photoObjectId });
    if (!photo) {
      return { statusCode: 404, headers, body: JSON.stringify({ error: 'Walk photo not found' }) };
    }
    if (photo.userId !== authenticatedUserId && user.userType !== 0) {
      return { statusCode: 403, headers, body: JSON.stringify({ error: 'Not authorized to edit this photo' }) };
    }

    await db.collection('walkPhotos').updateOne(
      { _id: photoObjectId },
      { $set: { info: photoInfo.trim(), experience: photoInfo.trim() } }
    );

    return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
  } catch (error) {
    console.error('Error editing walk photo:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Internal server error' }) };
  }
};
