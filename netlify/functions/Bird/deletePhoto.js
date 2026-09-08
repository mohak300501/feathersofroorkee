const { connectToDatabase } = require('../General/db');
const { deleteFileFromImageKit } = require('../General/imageKitAPI');
const { deleteFileFromDrive } = require('../General/driveAPI');
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
    const { photoId, birdId, userId } = JSON.parse(event.body);

    if (!photoId || !birdId || !userId) {
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
    const birdObjectId = new ObjectId(birdId);

    // Get the photo document
    const photoDoc = await db.collection('photos').findOne({ _id: photoObjectId, birdId: birdObjectId });
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
        body: JSON.stringify({ error: 'Not authorized to delete this photo' }),
      };
    }

    // Delete from Google Drive if driveFileId exists
    const fileIdToDelete = photoDoc.driveFileId;
    if (fileIdToDelete) {
      try {
        await deleteFileFromDrive(fileIdToDelete);
      } catch (driveError) {
        console.error('Error deleting from Drive:', driveError);
        // Continue with deletion even if Drive deletion fails
      }
    }

    // Delete from ImageKit if imagekitFileId exists
    const imagekitFileIdToDelete = photoDoc.imagekitFileId;

    if (imagekitFileIdToDelete) {
      try {
        await deleteFileFromImageKit(imagekitFileIdToDelete);
      } catch (imagekitError) {
        console.error('Error deleting from ImageKit:', imagekitError);
        // Continue MongoDB deletion even if ImageKit deletion fails
      }
    }

    // Delete from MongoDB
    await db.collection('photos').deleteOne({ _id: photoObjectId });

    // Update bird's photo count and potentially featured photo
    const birdDoc = await db.collection('birds').findOne({ _id: birdObjectId });

    const updateQuery = { $inc: { photoCount: -1 } };

    // If the deleted photo was the featured photo, update it
    const deletedPhotoIdForFeatured = photoDoc.imagekitFilePath;
    if (birdDoc && birdDoc.featuredPhoto === deletedPhotoIdForFeatured) {
      // Find the most recently uploaded photo for this bird to set as new featured
      const latestPhoto = await db.collection('photos')
        .find({ birdId: birdObjectId })
        .sort({ addedAt: -1 })
        .limit(1)
        .toArray();

      if (latestPhoto.length > 0) {
        updateQuery.$set = { featuredPhoto: latestPhoto[0].imagekitFilePath || latestPhoto[0].driveFileId };
      } else {
        updateQuery.$unset = { featuredPhoto: "" };
      }
    }

    await db.collection('birds').updateOne({ _id: birdObjectId }, updateQuery);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true }),
    };

  } catch (error) {
    console.error('Error deleting photo:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};