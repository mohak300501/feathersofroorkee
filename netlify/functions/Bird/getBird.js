const { connectToDatabase } = require('../General/db');
const { ObjectId } = require('mongodb');
const { getAuthenticatedUserId } = require('../firebaseAdmin');

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
  };
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };
  if (event.httpMethod !== 'GET') return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };

  const authenticatedUserId = await getAuthenticatedUserId(event);

  try {
    const { id, commonCode } = event.queryStringParameters || {};
    if (!id && !commonCode) return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing bird id or commonCode parameter' }) };

    const db = await connectToDatabase(context);
    let bird;
    if (commonCode) {
      bird = await db.collection('birds').findOne({ commonCode: { $regex: new RegExp(`^${commonCode}$`, 'i') } });
    } else {
      let birdObjectId;
      try { birdObjectId = new ObjectId(id); } catch { return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid bird ID format' }) }; }
      bird = await db.collection('birds').findOne({ _id: birdObjectId });
    }
    if (!bird) return { statusCode: 404, headers, body: JSON.stringify({ error: 'Bird not found' }) };

    const targetBirdId = bird._id;
    const [photos, sightings] = await Promise.all([
      db.collection('birdPhotos').aggregate([
        { $match: { birdId: targetBirdId } },
        { $lookup: { from: 'users', localField: 'userId', foreignField: 'uid', as: 'user' } },
        { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: 'hearts',
            let: { photoStrId: { $toString: '$_id' } },
            pipeline: [
              { $match: { $expr: { $eq: ['$photoId', '$$photoStrId'] } } }
            ],
            as: 'heartsData'
          }
        },
        {
          $project: {
            id: { $toString: '$_id' },
            fileId: 1,
            driveFileId: 1,
            imagekitFileId: 1,
            imagekitFilePath: 1,
            userId: 1,
            username: '$user.username',
            hearts: { $size: '$heartsData' },
            hasHearted: authenticatedUserId
              ? { $in: [authenticatedUserId, '$heartsData.userId'] }
              : { $literal: false },
            addedAt: 1,
          }
        },
        { $sort: { addedAt: -1 } },
      ]).toArray(),
      db.collection('birdSightings').aggregate([
        { $match: { birdId: targetBirdId } },
        { $lookup: { from: 'users', localField: 'userId', foreignField: 'uid', as: 'user' } },
        { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
        {
          $project: {
            id: { $toString: '$_id' },
            sightingId: { $toString: '$_id' },
            birdId: { $toString: '$birdId' },
            photoId: { $ifNull: ['$photoId', ''] },
            userId: 1,
            username: '$user.username',
            mapCoords: 1,
            location: 1,
            info: { $ifNull: ['$info', ''] },
            datetimeOfSighting: 1,
            addedAt: 1,
          }
        },
        { $sort: { addedAt: -1 } },
      ]).toArray(),
    ]);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, bird: { ...bird, id: bird._id.toString(), _id: undefined }, photos, sightings }),
    };
  } catch (error) {
    console.error('Error fetching bird:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Internal server error' }) };
  }
};
