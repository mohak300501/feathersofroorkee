const { connectToDatabase } = require('../General/db');

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
    const { familyName, familyOf, taxoPos, userId } = JSON.parse(event.body);

    if (!familyName || !familyOf || taxoPos === undefined || !userId) {
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

    // Check if family already exists
    const existingFamily = await db.collection('families').findOne({
      familyName: { $regex: new RegExp(`^${familyName.trim()}$`, 'i') }
    });

    if (existingFamily) {
      return {
        statusCode: 409,
        headers,
        body: JSON.stringify({ error: 'Family with this name already exists' }),
      };
    }

    // Convert comma separated string to array of strings
    const familyOfArray = typeof familyOf === 'string'
      ? familyOf.split(',').map(s => s.trim()).filter(Boolean)
      : Array.isArray(familyOf) ? familyOf : [];

    const familyResult = await db.collection('families').insertOne({
      familyName: familyName.trim(),
      familyOf: familyOfArray,
      taxoPos: Number(taxoPos)
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        familyId: familyResult.insertedId.toString(),
        familyName,
        familyOf: familyOfArray,
        taxoPos: Number(taxoPos)
      }),
    };

  } catch (error) {
    console.error('Error adding family:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};
