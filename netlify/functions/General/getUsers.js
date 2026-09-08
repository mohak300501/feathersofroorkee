const { connectToDatabase } = require('../General/db');

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const db = await connectToDatabase(context);
    const userId = event.queryStringParameters?.userId;

    if (!userId) {
      return { statusCode: 401, headers, body: JSON.stringify({ error: 'Unauthorized' }) };
    }

    const requestUser = await db.collection('users').findOne({ uid: userId });
    if (!requestUser || !requestUser.isAdmin) {
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
          from: 'payments',
          localField: 'uid',
          foreignField: 'userId',
          as: 'workshops'
        }
      },
      {
        $project: {
          _id: 0,
          uid: 1,
          email: 1,
          username: 1,
          isAdmin: 1,
          photoCount: { $size: '$photos' },
          workshopCount: { $size: '$workshops' },
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
