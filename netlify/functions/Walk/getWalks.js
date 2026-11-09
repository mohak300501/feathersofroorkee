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

    // Include only supported walk fields so stale stored fields are not exposed.
    const walks = await db.collection('walks')
      .aggregate([
        {
          $lookup: {
            from: 'walkRegistrations',
            let: {
              walkId: { $toString: '$_id' },
              walkCode: '$walkCode'
            },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $in: ['$walkId', ['$$walkId', '$$walkCode']]
                  }
                }
              },
              {
                $group: {
                  _id: null,
                  bookedSlots: {
                    $sum: { $ifNull: ['$slots', { $ifNull: ['$members', 1] }] }
                  }
                }
              }
            ],
            as: 'registrationSummary'
          }
        },
        {
          $project: {
            _id: 1,
            walkCode: 1,
            title: 1,
            info: 1,
            datetime: 1,
            location: 1,
            mapPin: 1,
            limit: 1,
            featuredPhoto: 1,
            addedBy: 1,
            addedAt: 1,
            bookedSlots: {
              $ifNull: [{ $arrayElemAt: ['$registrationSummary.bookedSlots', 0] }, 0]
            }
          }
        },
        { $sort: { datetime: -1 } }
      ])
      .toArray();

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(walks),
    };
  } catch (error) {
    console.error('Error fetching walks:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};