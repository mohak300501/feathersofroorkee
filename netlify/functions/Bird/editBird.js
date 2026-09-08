const { connectToDatabase } = require('../General/db');
const { ObjectId } = require('mongodb');
const { generateUniqueCommonCode } = require('../General/commonCode');

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
    const { birdId, commonName, scientificName, familyId, userId, iucnStatus, isMigratory, info } = JSON.parse(event.body);

    if (!birdId || !commonName || !scientificName || !userId) {
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

    // Get existing bird
    const existingBird = await db.collection('birds').findOne({ _id: birdObjectId });
    if (!existingBird) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Bird not found' }),
      };
    }

    let commonCode = existingBird.commonCode;

    // Check if commonName has changed
    if (existingBird.commonName.toLowerCase() !== commonName.trim().toLowerCase()) {
      // Check for name collision
      const nameCollision = await db.collection('birds').findOne({
        commonName: { $regex: new RegExp(`^${commonName.trim()}$`, 'i') },
        _id: { $ne: birdObjectId }
      });

      if (nameCollision) {
        return {
          statusCode: 409,
          headers,
          body: JSON.stringify({ error: 'Another bird with this common name already exists' }),
        };
      }

      // Generate new common code
      const allBirds = await db.collection('birds').find({ _id: { $ne: birdObjectId } }, { projection: { commonCode: 1 } }).toArray();
      const existingCodes = allBirds.map(b => b.commonCode).filter(Boolean);
      commonCode = generateUniqueCommonCode(commonName.trim(), existingCodes);
    }

    // Update the bird
    await db.collection('birds').updateOne(
      { _id: birdObjectId },
      {
        $set: {
          commonName: commonName.trim(),
          scientificName: scientificName.trim(),
          familyId: familyId,
          commonCode: commonCode,
          iucnStatus: iucnStatus,
          isMigratory: Boolean(isMigratory),
          info: info ? info.trim() : ''
        }
      }
    );

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        commonCode
      }),
    };

  } catch (error) {
    console.error('Error updating bird:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};
