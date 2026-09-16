const { connectToDatabase } = require('./db');

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

    // 1. Total photos
    const totalPhotos = await db.collection('birdPhotos').countDocuments();

    // 2. Total bird species
    const totalBirds = await db.collection('birds').countDocuments();

    // 3. Total users
    const totalUsers = await db.collection('users').countDocuments();

    // 4. Total families
    const totalFamilies = await db.collection('families').countDocuments();

    // 5. Total visits
    const totalVisits = await db.collection('visits').findOne({ _id: 'global' });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        totalPhotos,
        totalBirds,
        totalUsers,
        totalFamilies,
        totalVisits: totalVisits.count
      }),
    };

  } catch (error) {
    console.error('Error fetching public stats:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error', details: error.message, stack: error.stack }),
    };
  }
};
