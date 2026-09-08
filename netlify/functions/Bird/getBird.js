const { connectToDatabase } = require('../General/db');
const { ObjectId } = require('mongodb');

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
    const { id, commonCode } = event.queryStringParameters || {};

    if (!id && !commonCode) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing bird id or commonCode parameter' }) };
    }

    const db = await connectToDatabase(context);

    // Fetch the bird
    let bird;
    if (commonCode) {
      bird = await db.collection('birds').findOne({
        commonCode: { $regex: new RegExp(`^${commonCode}$`, 'i') }
      });
    } else {
      let birdObjectId;
      try {
        birdObjectId = new ObjectId(id);
      } catch (e) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid bird ID format' }) };
      }
      bird = await db.collection('birds').findOne({ _id: birdObjectId });
    }

    if (!bird) {
      return { statusCode: 404, headers, body: JSON.stringify({ error: 'Bird not found' }) };
    }

    const targetBirdId = bird._id;

    // Fetch the photos for this bird and lookup user info (username) for each photo
    const photos = await db.collection('photos').aggregate([
      { $match: { birdId: targetBirdId } },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: 'uid',
          as: 'user'
        }
      },
      { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          id: { $toString: '$_id' },
          fileId: 1,
          driveFileId: 1,
          imagekitFileId: 1,
          imagekitFilePath: 1,
          location: 1,
          dateOfCapture: 1,
          userId: 1,
          username: '$user.username',
          addedAt: 1
        }
      },
      { $sort: { addedAt: -1 } }
    ]).toArray();

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        bird: {
          ...bird,
          id: bird._id.toString(),
          _id: undefined
        },
        photos
      }),
    };

  } catch (error) {
    console.error('Error fetching bird:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Internal server error' }) };
  }
};
