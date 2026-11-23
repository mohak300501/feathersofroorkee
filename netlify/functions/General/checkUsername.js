const { connectToDatabase } = require('./db');
const createUsernameFilter = require('./usernameFilter');

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
    let requestData;
    try {
      requestData = JSON.parse(event.body || '{}');
    } catch {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid JSON payload' }) };
    }

    const { username } = requestData;
    const validationError = createUsernameFilter.validateUsername(username);
    if (validationError) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: validationError }) };
    }

    const db = await connectToDatabase(context);
    const existingUser = await db.collection('users').findOne(createUsernameFilter(username));
    if (existingUser) {
      return { statusCode: 200, headers, body: JSON.stringify({ available: false }) };
    }

    return { statusCode: 200, headers, body: JSON.stringify({ available: true }) };
  } catch (error) {
    console.error('Error checking username:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Internal server error' }) };
  }
};
