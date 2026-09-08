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

    const birds = await db.collection('birds').aggregate([
      {
        $addFields: {
          familyObjectId: {
            $convert: {
              input: "$familyId",
              to: "objectId",
              onError: null,
              onNull: null
            }
          }
        }
      },
      {
        $lookup: {
          from: 'families',
          localField: 'familyObjectId',
          foreignField: '_id',
          as: 'family'
        }
      },
      {
        $unwind: {
          path: '$family',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $sort: { "family.taxoPos": 1, "commonName": 1 }
      }
    ]).toArray();


    // Map _id to id for frontend compatibility and format family fields
    const formattedBirds = birds.map(bird => {
      const familyName = bird.family ? bird.family.familyName : 'Uncategorized';
      const familyOfStr = bird.family && bird.family.familyOf && bird.family.familyOf.length > 0
        ? bird.family.familyOf.join(', ') : '';
      const familyDisplay = familyOfStr ? `${familyName}: ${familyOfStr}` : familyName;

      return {
        ...bird,
        id: bird._id.toString(),
        familyName,
        familyDisplay,
        featuredPhoto: bird.featuredPhoto,
        taxoPos: bird.family ? bird.family.taxoPos : 9999,
        _id: undefined,
        family: undefined,
        familyObjectId: undefined
      };
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        birds: formattedBirds
      }),
    };

  } catch (error) {
    console.error('Error fetching birds:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error', details: error.message, stack: error.stack }),
    };
  }
};
