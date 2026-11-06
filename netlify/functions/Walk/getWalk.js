const { connectToDatabase } = require('../General/db');
const { ObjectId } = require('mongodb');

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
    const { walkCode } = event.queryStringParameters || {};

    if (!walkCode) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing walkCode parameter' }),
      };
    }

    const db = await connectToDatabase(context);

    let query = { walkCode };
    if (ObjectId.isValid(walkCode)) {
      query = { $or: [{ walkCode }, { _id: new ObjectId(walkCode) }] };
    }

    const walk = await db.collection('walks').findOne(query);

    if (!walk) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Walk not found' }),
      };
    }

    // Fetch walkPhotos photos for this walk and lookup username
    const walkPhotos = await db.collection('walkPhotos')
      .aggregate([
        {
          $match: {
            $or: [
              { walkId: walk._id.toString() },
              { walkId: walk.walkCode }
            ]
          }
        },
        { $sort: { addedAt: -1 } },
        {
          $lookup: {
            from: 'users',
            localField: 'userId',
            foreignField: 'uid',
            as: 'user'
          }
        },
        {
          $addFields: {
            username: { $arrayElemAt: ['$user.username', 0] }
          }
        },
        {
          $project: {
            user: 0 // exclude the full user array
          }
        }
      ])
      .toArray();

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ ...walk, walkPhotos }),
    };
  } catch (error) {
    console.error('Error fetching walk:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};