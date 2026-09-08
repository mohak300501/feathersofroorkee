const { connectToDatabase } = require('../General/db');
const { ObjectId } = require('mongodb');
const google = require('googleapis');

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
    const { birdId, userId } = JSON.parse(event.body);

    if (!birdId || !userId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing required fields' }),
      };
    }

    const db = await connectToDatabase(context);

    // Check if user is admin
    const userDoc = await db.collection('users').findOne({ uid: userId });
    if (!userDoc || !userDoc.isAdmin) {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ error: 'Admin privileges required' }),
      };
    }

    const birdObjectId = new ObjectId(birdId);

    // Get all photos for this bird
    const photos = await db.collection('photos').find({ birdId: birdObjectId }).toArray();

    // Initialize Google Drive API
    let drive;
    if (photos.length > 0) {
      const { google: googleApi } = google;
      const auth = new googleApi.auth.GoogleAuth({
        credentials: {
          client_email: process.env.FIREBASE_CLIENT_EMAIL,
          private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        },
        scopes: ['https://www.googleapis.com/auth/drive'],
      });
      drive = googleApi.drive({ version: 'v3', auth });
    }

    // Delete photos from Google Drive and MongoDB
    for (const photo of photos) {
      const fileIdToDelete = photo.fileId;
      if (fileIdToDelete) {
        try {
          await drive.files.delete({
            fileId: fileIdToDelete,
            supportsAllDrives: true,
          });
        } catch (error) {
          console.error(`Error deleting file ${fileIdToDelete} from Drive:`, error);
        }
      }
    }

    // Delete all photos from MongoDB
    await db.collection('photos').deleteMany({ birdId: birdObjectId });

    // Delete the bird
    await db.collection('birds').deleteOne({ _id: birdObjectId });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true }),
    };

  } catch (error) {
    console.error('Error deleting bird:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};