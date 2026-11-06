const { connectToDatabase } = require('../General/db');
const { ObjectId } = require('mongodb');

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'PUT, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'PUT') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    let requestData;
    try {
      requestData = JSON.parse(event.body || '{}');
    } catch {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid JSON payload' }) };
    }
    const { walkId, title, info, datetime, location, mapPin, limit, userId } = requestData;

    if (!walkId || !userId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing required fields' }),
      };
    }

    if (!ObjectId.isValid(walkId)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid walk ID format' }),
      };
    }

    const db = await connectToDatabase(context);

    // Verify user is strictly admin
    const user = await db.collection('users').findOne({ uid: userId });
    if (!user || !user.isAdmin) {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ error: 'Admin privileges required' }),
      };
    }

    const updateFields = {};
    if (title !== undefined) updateFields.title = title;
    if (info !== undefined) updateFields.info = info;
    if (datetime) {
      const d = new Date(datetime);
      if (!isNaN(d.getTime())) {
        updateFields.datetime = d;
      }
    }
    if (location !== undefined) updateFields.location = location;
    if (mapPin !== undefined) updateFields.mapPin = mapPin;
    if (limit !== undefined) {
      const parsedLimit = parseInt(limit, 10);
      if (!isNaN(parsedLimit) && parsedLimit > 0) {
        updateFields.limit = parsedLimit;
      }
    }

    const result = await db.collection('walks').updateOne(
      { _id: new ObjectId(walkId) },
      { $set: updateFields }
    );

    if (result.matchedCount === 0) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Walk not found' }),
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true }),
    };
  } catch (error) {
    console.error('Error editing walk:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error', details: error.message }),
    };
  }
};