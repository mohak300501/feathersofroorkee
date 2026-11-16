const { ObjectId } = require('mongodb');
const { connectToDatabase } = require('../General/db');
const { getAuthenticatedUserId } = require('../firebaseAdmin');
const { deleteFileFromImageKit } = require('../General/imageKitAPI');
const { deleteFileFromDrive } = require('../General/driveAPI');

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, DELETE, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };
  if (event.httpMethod !== 'POST' && event.httpMethod !== 'DELETE') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    let requestData;
    try {
      requestData = JSON.parse(event.body || '{}');
    } catch {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid JSON payload' }) };
    }

    const { walkId, photoId, userId } = requestData;
    if (!photoId || !userId) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Photo ID and User ID are required' }) };
    }
    if (!ObjectId.isValid(photoId)) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid photo ID' }) };
    }

    const authenticatedUserId = await getAuthenticatedUserId(event);
    if (!authenticatedUserId || authenticatedUserId !== userId) {
      return { statusCode: 401, headers, body: JSON.stringify({ error: 'Authentication required' }) };
    }

    const db = await connectToDatabase(context);
    const user = await db.collection('users').findOne({ uid: authenticatedUserId });
    if (!user) {
      return { statusCode: 403, headers, body: JSON.stringify({ error: 'User must be authenticated' }) };
    }

    const photoObjectId = new ObjectId(photoId);
    const photo = await db.collection('walkPhotos').findOne({ _id: photoObjectId });
    if (!photo) {
      return { statusCode: 404, headers, body: JSON.stringify({ error: 'Walk photo not found' }) };
    }

    if (photo.userId !== authenticatedUserId && user.userType !== 0) {
      return { statusCode: 403, headers, body: JSON.stringify({ error: 'Not authorized to delete this photo' }) };
    }

    // Delete from Google Drive if driveFileId exists
    if (photo.driveFileId) {
      try {
        await deleteFileFromDrive(photo.driveFileId);
      } catch (driveError) {
        console.error('Error deleting from Drive:', driveError);
      }
    }

    // Delete from ImageKit if imagekitFileId exists
    if (photo.imagekitFileId) {
      try {
        await deleteFileFromImageKit(photo.imagekitFileId);
      } catch (imagekitError) {
        console.error('Error deleting from ImageKit:', imagekitError);
      }
    }

    // Delete from MongoDB
    await db.collection('walkPhotos').deleteOne({ _id: photoObjectId });

    // If deleted photo was walk's featuredPhoto, reset or update it
    if (walkId) {
      const walkQuery = ObjectId.isValid(walkId)
        ? { $or: [{ _id: new ObjectId(walkId) }, { walkCode: walkId }] }
        : { walkCode: walkId };
      const walkDoc = await db.collection('walks').findOne(walkQuery);
      if (walkDoc && (walkDoc.featuredPhoto === photo.imagekitFilePath || walkDoc.featuredPhoto === photo.driveFileId)) {
        const remainingPhoto = await db.collection('walkPhotos').findOne(
          { $or: [{ walkId: walkDoc._id.toString() }, { walkId: walkDoc.walkCode }] },
          { sort: { addedAt: -1 } }
        );
        await db.collection('walks').updateOne(
          { _id: walkDoc._id },
          { $set: { featuredPhoto: remainingPhoto ? remainingPhoto.imagekitFilePath : '' } }
        );
      }
    }

    return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
  } catch (error) {
    console.error('Error deleting walk photo:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Internal server error' }) };
  }
};

