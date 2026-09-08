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
    const { photoId, userId, newBirdId, oldBirdId } = JSON.parse(event.body);

    if (!photoId || !userId || !newBirdId || !oldBirdId) {
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
    const oldBirdObjectId = new ObjectId(oldBirdId);
    const newBirdObjectId = new ObjectId(newBirdId);

    // Get the photo document
    const photoDoc = await db.collection('photos').findOne({ _id: photoObjectId, birdId: oldBirdObjectId });
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
        body: JSON.stringify({ error: 'Not authorized to move this photo' }),
      };
    }

    // Check if new bird exists
    const newBirdDoc = await db.collection('birds').findOne({ _id: newBirdObjectId });
    if (!newBirdDoc) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Target bird not found' }),
      };
    }

    // Move the photo to the new bird
    await db.collection('photos').updateOne(
      { _id: photoObjectId },
      {
        $set: {
          birdId: newBirdObjectId,
          updatedAt: new Date()
        }
      }
    );

    // Update photo count and featured photo for old bird
    const oldBirdDoc = await db.collection('birds').findOne({ _id: oldBirdObjectId });
    const oldUpdateQuery = { $inc: { photoCount: -1 } };

    if (oldBirdDoc && oldBirdDoc.featuredPhoto === photoDoc.fileId) {
      // Pick a new featured photo
      const latestPhoto = await db.collection('photos')
        .find({ birdId: oldBirdObjectId })
        .sort({ addedAt: -1 }) // user changed this in getBird.js to addedAt
        .limit(1)
        .toArray();

      if (latestPhoto.length > 0) {
        oldUpdateQuery.$set = { featuredPhoto: latestPhoto[0].fileId };
      } else {
        oldUpdateQuery.$unset = { featuredPhoto: "" };
      }
    }
    await db.collection('birds').updateOne({ _id: oldBirdObjectId }, oldUpdateQuery);

    // Update photo count and potentially featured photo for new bird
    const newUpdateQuery = { $inc: { photoCount: 1 } };
    if (!newBirdDoc.featuredPhoto) {
      newUpdateQuery.$set = { featuredPhoto: photoDoc.fileId };
    }
    await db.collection('birds').updateOne({ _id: newBirdObjectId }, newUpdateQuery);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true }),
    };

  } catch (error) {
    console.error('Error switching photo species:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};
