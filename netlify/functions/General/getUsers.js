const { connectToDatabase } = require('../General/db');
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
    const userId = await getAuthenticatedUserId(event);
    if (!userId) {
      return { statusCode: 401, headers, body: JSON.stringify({ error: 'Unauthorized' }) };
    }

    const db = await connectToDatabase(context);
    const requestUser = await db.collection('users').findOne({ uid: userId });
    if (!requestUser || requestUser.userType !== 0) {
      return { statusCode: 403, headers, body: JSON.stringify({ error: 'Admin access required' }) };
    }

    // Get all users
    const users = await db.collection('users').aggregate([
      {
        $lookup: {
          from: 'photos',
          localField: 'uid',
          foreignField: 'userId',
          as: 'photos'
        }
      },
      {
        $lookup: {
          from: 'walkRegistrations',
          localField: 'uid',
          foreignField: 'userId',
          as: 'walks'
        }
      },
      {
        $project: {
          _id: 0,
          uid: 1,
          email: 1,
          username: 1,
          whatsapp: 1,
          userType: 1,
          photoCount: { $size: '$photos' },
          walkCount: { $size: '$walks' },
          createdAt: 1
        }
      },
      { $sort: { displayName: 1 } }
    ]).toArray();

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        users
      }),
    };
  } catch (error) {
    console.error('Error fetching users:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};
