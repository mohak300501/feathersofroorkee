const { connectToDatabase } = require('../General/db');
const { ObjectId } = require('mongodb');

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
    const { birdId, fileId, userId } = JSON.parse(event.body);

    if (!birdId || !fileId || !userId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing required fields' }),
      };
    }

    const db = await connectToDatabase(context);

    // Check if user exists and get permissions
    const userDoc = await db.collection('users').findOne({ uid: userId });
    if (!userDoc || !userDoc.isAdmin) {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ error: 'Admin privileges required' }),
      };
    }

    const birdObjectId = new ObjectId(birdId);

    // Check if bird exists
    const birdDoc = await db.collection('birds').findOne({ _id: birdObjectId });
    if (!birdDoc) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Bird not found' }),
      };
    }

    // Set the featured photo
    await db.collection('birds').updateOne(
      { _id: birdObjectId },
      { $set: { featuredPhoto: fileId } }
    );

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true }),
    };

  } catch (error) {
    console.error('Error setting featured photo:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};
