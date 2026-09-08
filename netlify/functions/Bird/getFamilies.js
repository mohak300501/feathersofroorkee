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

    // Fetch all families and order by taxonomic position
    const families = await db.collection('families').find().sort({ taxoPos: 1 }).toArray();

    // Map _id to id for frontend compatibility
    const formattedFamilies = families.map(family => ({
      ...family,
      id: family._id.toString(),
      _id: undefined
    }));

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        families: formattedFamilies
      }),
    };

  } catch (error) {
    console.error('Error fetching families:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error', details: error.message, stack: error.stack }),
    };
  }
};
