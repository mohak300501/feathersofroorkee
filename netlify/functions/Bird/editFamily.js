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
    const { familyId, familyName, familyOf, taxoPos, userId } = JSON.parse(event.body);

    if (!familyId || !familyName || !familyOf || taxoPos === undefined || !userId) {
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

    const existingFamily = await db.collection('families').findOne({ _id: familyObjectId });
    if (!existingFamily) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Family not found' }),
      };
    }

    // Check for name collision
    if (existingFamily.familyName.toLowerCase() !== familyName.trim().toLowerCase()) {
      const nameCollision = await db.collection('families').findOne({
        familyName: { $regex: new RegExp(`^${familyName.trim()}$`, 'i') },
        _id: { $ne: familyObjectId }
      });

      if (nameCollision) {
        return {
          statusCode: 409,
          headers,
          body: JSON.stringify({ error: 'Another family with this name already exists' }),
        };
      }
    }

    const familyOfArray = typeof familyOf === 'string'
      ? familyOf.split(',').map(s => s.trim()).filter(Boolean)
      : Array.isArray(familyOf) ? familyOf : [];

    await db.collection('families').updateOne(
      { _id: familyObjectId },
      {
        $set: {
          familyName: familyName.trim(),
          familyOf: familyOfArray,
          taxoPos: Number(taxoPos)
        }
      }
    );

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true
      }),
    };

  } catch (error) {
    console.error('Error updating family:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};
