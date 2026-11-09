const { connectToDatabase } = require('../General/db');
const { ObjectId } = require('mongodb');
const { getAuthenticatedUserId } = require('../firebaseAdmin');

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const { walkId, userId } = event.queryStringParameters || {};
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

    // Support both ObjectId and string formats for legacy registrations.
    const walkIdValues = [
      walk._id,
      walk._id.toString(),
      walk.walkCode
    ];

    const registration = await db.collection('walkRegistrations').findOne({
      walkId: { $in: walkIdValues },
      userId
    });

    const response = {
      success: true,
      registration: registration
        ? { slots: registration.slots ?? 1 }
        : null
    };

    if (user.isAdmin) {
      const registrations = await db.collection('walkRegistrations').aggregate([
        {
          $match: {
            walkId: { $in: walkIdValues }
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: 'userId',
            foreignField: 'uid',
            as: 'user'
          }
        },
        {
          $project: {
            _id: 0,
            username: {
              $ifNull: [
                { $arrayElemAt: ['$user.username', 0] },
                { $ifNull: ['$username', { $arrayElemAt: ['$user.email', 0] }] }
              ]
            },
            whatsapp: {
              $arrayElemAt: ['$user.whatsapp', 0]
            },
            slots: { $ifNull: ['$slots', 1] }
          }
        },
        { $sort: { username: 1 } }
      ]).toArray();

      response.registrations = registrations.map((entry) => ({
        username: entry.username || 'Unknown user',
        whatsapp: entry.whatsapp || '',
        slots: entry.slots
      }));
    }

    return { statusCode: 200, headers, body: JSON.stringify(response) };
  } catch (error) {
    console.error('Error fetching walk registrations:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};
