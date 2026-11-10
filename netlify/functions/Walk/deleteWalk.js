const { connectToDatabase } = require('../General/db');
const { deleteFileFromImageKit } = require('../General/imageKitAPI');
const { ObjectId } = require('mongodb');

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
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing required fields' }),
      };
    }

    if (!ObjectId.isValid(walkId)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid walk ID format' }),
      };
    }

    const db = await connectToDatabase(context);

    // Verify user is strictly admin
    const user = await db.collection('users').findOne({ uid: userId });
    if (!user || user.userType !== 0) {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ error: 'Admin privileges required' }),
      };
    }

    const walkObjectId = new ObjectId(walkId);
    const walk = await db.collection('walks').findOne({ _id: walkObjectId });
    if (!walk) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Walk not found' }),
      };
    }

    // Delete associated photos from ImageKit and DB
    const photos = await db.collection('walkPhotos').find({
      $or: [{ walkId: walkObjectId.toString() }, { walkId: walk.walkCode }]
    }).toArray();

    for (const p of photos) {
      if (p.imagekitFileId) {
        try {
          await deleteFileFromImageKit(p.imagekitFileId);
        } catch (e) {
          console.error('Error deleting ImageKit file for walk photo:', e);
        }
      }
    }

    await db.collection('walkPhotos').deleteMany({
      $or: [{ walkId: walkObjectId.toString() }, { walkId: walk.walkCode }]
    });

    await db.collection('walks').deleteOne({ _id: walkObjectId });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true }),
    };
  } catch (error) {
    console.error('Error deleting walk:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error', details: error.message }),
    };
  }
};