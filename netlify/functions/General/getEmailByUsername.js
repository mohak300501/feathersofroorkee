const { connectToDatabase } = require('./db');

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const { username } = JSON.parse(event.body);

    if (!username) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing username' }),
      };
    }

    const db = await connectToDatabase(context);
    
    // Perform case-insensitive check
    const user = await db.collection('users').findOne({ 
      username: { $regex: new RegExp(`^${username}$`, 'i') } 
    });

    if (user) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ email: user.email }),
      };
    }

    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ error: 'User not found' }),
    };

  } catch (error) {
    console.error('Error fetching user email:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};
