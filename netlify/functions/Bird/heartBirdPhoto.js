const { connectToDatabase } = require('../General/db');
const { getAuthenticatedUserId } = require('../firebaseAdmin');

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };

  try {
    const { photoId } = JSON.parse(event.body || '{}');
    if (!photoId) return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing photoId' }) };
    const db = await connectToDatabase(context);
    const heartsCollection = db.collection('hearts');

    const authenticatedUserId = await getAuthenticatedUserId(event);
    if (!authenticatedUserId) {
      return { statusCode: 401, headers, body: JSON.stringify({ error: 'Authentication required' }), };
    }

    const existingHeart = await heartsCollection.findOne({ photoId, userId: authenticatedUserId });

    if (existingHeart) {
      await heartsCollection.deleteOne({ _id: existingHeart._id });
    } else {
      await heartsCollection.insertOne({ photoId, userId: authenticatedUserId, addedAt: new Date() });
    }

    const hearts = await heartsCollection.countDocuments({ photoId });

    return { statusCode: 200, headers, body: JSON.stringify({ success: true, hearts, hasHearted: !existingHeart }) };
  } catch (error) {
    console.error('Error adding heart:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Internal server error' }) };
  }
};