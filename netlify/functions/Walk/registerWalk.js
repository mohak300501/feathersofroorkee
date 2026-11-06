const { connectToDatabase } = require('../General/db');
const { ObjectId } = require('mongodb');

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    let requestData;
    try {
      requestData = JSON.parse(event.body || '{}');
    } catch {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid JSON payload' }) };
    }
    const { walkId, members, userId } = requestData;

    if (!walkId || !members || !userId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing required fields' }),
      };
    }

    const membersCount = parseInt(members, 10);
    if (isNaN(membersCount) || membersCount < 1) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid number of members' }),
      };
    }

    const db = await connectToDatabase(context);

    const user = await db.collection('users').findOne({ uid: userId });
    if (!user) {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({ error: 'User must be authenticated' })
      };
    }

    // Lookup walk by _id or walkCode
    let walkQuery = { walkCode: walkId };
    if (ObjectId.isValid(walkId)) {
      walkQuery = { $or: [{ _id: new ObjectId(walkId) }, { walkCode: walkId }] };
    }
    const walk = await db.collection('walks').findOne(walkQuery);
    if (!walk) {
      return { statusCode: 404, headers, body: JSON.stringify({ error: 'Walk not found' }) };
    }

    const maxCapacity = walk.limit && walk.limit > 0 ? walk.limit : 25;
    const currentCount = walk.participantCount || 0;
    if (currentCount + membersCount > maxCapacity) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: `Not enough available slots in this walk (Available: ${Math.max(0, maxCapacity - currentCount)})`
        })
      };
    }

    const updateResult = await db.collection('walks').updateOne(
      { _id: walk._id, participantCount: { $lte: maxCapacity - membersCount } },
      { $inc: { participantCount: membersCount } }
    );

    if (updateResult.modifiedCount === 0) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Failed to reserve slots. Walk might be full.' }) };
    }

    await db.collection('walkRegistrations').insertOne({
      walkId: walk._id.toString(),
      walkCode: walk.walkCode,
      userId,
      username: user.username,
      members: membersCount,
      registeredAt: new Date()
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, updatedParticipantCount: currentCount + membersCount }),
    };
  } catch (error) {
    console.error('Error registering for walk:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error', details: error.message }),
    };
  }
};