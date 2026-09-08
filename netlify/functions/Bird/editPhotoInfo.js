const { connectToDatabase } = require('../General/db');
const { ObjectId } = require('mongodb');

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'PUT, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'PUT') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const { photoId, userId, location, dateOfCapture } = JSON.parse(event.body);

    if (!photoId || !userId || !location || !dateOfCapture) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing required fields' }),
      };
    }

    const db = await connectToDatabase(context);

    // Check if user exists and get permissions
    const userDoc = await db.collection('users').findOne({ uid: userId });
    if (!userDoc) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'User not found' }),
      };
    }
    const isAdmin = userDoc.isAdmin === true;

    const photoObjectId = new ObjectId(photoId);

    // Get the photo document
    const photoDoc = await db.collection('photos').findOne({ _id: photoObjectId });
    if (!photoDoc) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Photo not found' }),
      };
    }

    // Check permissions
    if (photoDoc.userId !== userId && !isAdmin) {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ error: 'Not authorized to edit this photo' }),
      };
    }

    // Update the photo
    await db.collection('photos').updateOne(
      { _id: photoObjectId },
      {
        $set: {
          location,
          dateOfCapture: new Date(dateOfCapture),
          updatedAt: new Date()
        }
      }
    );

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true }),
    };

  } catch (error) {
    console.error('Error editing photo info:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};
