const { connectToDatabase } = require('../General/db');
const { ObjectId } = require('mongodb');
const { getAuthenticatedUserId } = require('../firebaseAdmin');
const { getBookedSlots } = require('./common');

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
    const { walkId, slots, userId } = requestData;

    if (!walkId || !slots || !userId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing required fields' }),
      };
    }

    const authenticatedUserId = await getAuthenticatedUserId(event);
    if (!authenticatedUserId || authenticatedUserId !== userId) {
      return { statusCode: 401, headers, body: JSON.stringify({ error: 'Authentication required' }) };
    }

    const slotsCount = Number(slots);
    if (!Number.isInteger(slotsCount) || slotsCount < 1) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid number of slots' }),
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

    if (!user.whatsapp) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Kindly update your WhatsApp contact in your profile to register for birdwalks.' })
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

    const registrations = db.collection('walkRegistrations');
    await registrations.createIndex({ walkId: 1, userId: 1 }, { unique: true });

    const canonicalWalkId = walk._id.toString();

    const walkIdValues = [walk._id, canonicalWalkId, walk.walkCode];

    // Check all supported walkId formats before inserting.
    const existingRegistration = await registrations.findOne({
      walkId: { $in: walkIdValues },
      userId
    });

    if (existingRegistration) {
      return {
        statusCode: 409,
        headers,
        body: JSON.stringify({ error: 'You are already registered for this walk' }),
      };
    }

    const maxCapacity = walk.limit && walk.limit > 0 ? walk.limit : 25;
    const currentCount = await getBookedSlots(db, walk);
    if (currentCount + slotsCount > maxCapacity) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: `Not enough available slots in this walk (Available: ${Math.max(0, maxCapacity - currentCount)})`
        })
      };
    }

    let registration;
    try {
      registration = await registrations.insertOne({
        walkId: canonicalWalkId,
        userId,
        slots: slotsCount,
        registeredAt: new Date()
      });
    } catch (error) {
      if (error.code === 11000) {
        return {
          statusCode: 409,
          headers,
          body: JSON.stringify({ error: 'You are already registered for this walk' }),
        };
      }
      throw error;
    }

    let updatedBookedSlots;
    try {
      updatedBookedSlots = await getBookedSlots(db, walk);
    } catch (error) {
      await registrations.deleteOne({ _id: registration.insertedId });
      throw error;
    }

    if (updatedBookedSlots > maxCapacity) {
      await registrations.deleteOne({ _id: registration.insertedId });
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: `Not enough available slots in this walk (Available: ${Math.max(0, maxCapacity - currentCount)})`
        })
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, bookedSlots: updatedBookedSlots }),
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