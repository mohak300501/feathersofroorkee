const { connectToDatabase } = require('../General/db');
const { ObjectId } = require('mongodb');

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS', // POST used for deletion in this app
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const { familyId, userId } = JSON.parse(event.body);

    if (!familyId || !userId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing required fields' }),
      };
    }

    const db = await connectToDatabase(context);

    const userDoc = await db.collection('users').findOne({ uid: userId });
    if (!userDoc || !userDoc.isAdmin) {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ error: 'Admin privileges required' }),
      };
    }

    const familyObjectId = new ObjectId(familyId);

    // Check if any birds belong to this family before deleting
    const associatedBirds = await db.collection('birds').countDocuments({ familyId: familyId });
    if (associatedBirds > 0) {
      return {
        statusCode: 409,
        headers,
        body: JSON.stringify({ error: `Cannot delete family: ${associatedBirds} bird(s) are associated with it. Please update those birds first.` })
      };
    }

    const result = await db.collection('families').deleteOne({ _id: familyObjectId });

    if (result.deletedCount === 0) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Family not found' }),
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true }),
    };

  } catch (error) {
    console.error('Error deleting family:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};
