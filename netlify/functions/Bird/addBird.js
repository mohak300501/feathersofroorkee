const { connectToDatabase } = require('../General/db');
const { generateUniqueCommonCode } = require('../General/commonCode');

const escapeRegex = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

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
    const { commonName, scientificName, familyId, userId, iucnStatus, isMigratory, info } = JSON.parse(event.body);

    if (!commonName || !scientificName || !userId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing required fields' }),
      };
    }

    const normalizedCommonName = commonName.trim();
    const normalizedScientificName = scientificName.trim();
    if (!normalizedCommonName || !normalizedScientificName) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Common name and scientific name are required' }),
      };
    }

    const db = await connectToDatabase(context);

    // Check if user is admin
    const userDoc = await db.collection('users').findOne({ uid: userId });
    if (!userDoc) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'User not found' }),
      };
    }

    if (userDoc.userType !== 0) {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ error: 'Admin privileges required' }),
      };
    }

    // Do not create another record if either species name is already in use.
    const existingBird = await db.collection('birds').findOne({
      $or: [
        { commonName: { $regex: new RegExp(`^${escapeRegex(normalizedCommonName)}$`, 'i') } },
        { scientificName: { $regex: new RegExp(`^${escapeRegex(normalizedScientificName)}$`, 'i') } },
      ],
    });

    if (existingBird) {
      return {
        statusCode: 409,
        headers,
        body: JSON.stringify({ error: 'Bird with this common name or scientific name already exists' }),
      };
    }

    // Get all existing commonCodes to ensure uniqueness
    const allBirds = await db.collection('birds').find({}, { projection: { commonCode: 1 } }).toArray();
    const existingCodes = allBirds.map(b => b.commonCode).filter(Boolean);

    // Generate unique commonCode
    const commonCode = generateUniqueCommonCode(normalizedCommonName, existingCodes);

    // Add bird to MongoDB
    const birdResult = await db.collection('birds').insertOne({
      commonName: normalizedCommonName,
      scientificName: normalizedScientificName,
      familyId: familyId,
      commonCode: commonCode,
      photoCount: 0,
      iucnStatus: iucnStatus,
      isMigratory: Boolean(isMigratory),
      info: info ? info.trim() : ''
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        birdId: birdResult.insertedId.toString(),
        commonName,
        scientificName,
        commonCode
      }),
    };

  } catch (error) {
    console.error('Error adding bird:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};