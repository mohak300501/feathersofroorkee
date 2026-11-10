const { connectToDatabase } = require('./db');

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };
  if (event.httpMethod !== 'GET') return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };

  try {
    const db = await connectToDatabase(context);
    const members = await db.collection('users').find(
      { userType: 1, status: { $in: ['Current', 'Former'] } },
      { projection: { _id: 0, username: 1, userPhoto: 1, status: 1 } }
    ).sort({ username: 1 }).toArray();

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, members }),
    };
  } catch (error) {
    console.error('Error fetching team members:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Internal server error' }) };
  }
};
