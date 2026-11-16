const { connectToDatabase } = require('./db');
const { getAuthenticatedUserId } = require('../firebaseAdmin');

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    // 1. Parse request body.
    let requestData;
    try {
      requestData = JSON.parse(event.body || '{}');
    } catch {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid JSON payload' }) };
    }

    const { uid, email, username } = requestData;

    // 2. Validate request fields.
    if (typeof uid !== 'string' || !uid.trim()) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing or invalid uid' }) };
    }

    if (typeof email !== 'string' || !email.trim()) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing or invalid email' }) };
    }

    const hasUsername = username !== undefined;
    if (hasUsername && (typeof username !== 'string' || username.trim().length < 3)) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Username must contain at least 3 characters' }) };
    }

    // 3. Verify Firebase authentication.
    const authenticatedUserId = await getAuthenticatedUserId(event);
    if (!authenticatedUserId) {
      return { statusCode: 401, headers, body: JSON.stringify({ error: 'Authentication required' }) };
    }
    if (authenticatedUserId !== uid) {
      return { statusCode: 403, headers, body: JSON.stringify({ error: 'You cannot synchronize another user account' }) };
    }

    // 4. Connect to MongoDB.
    const db = await connectToDatabase(context);
    const users = db.collection('users');
    const existingUser = await users.findOne({ uid });

    // 5. A new user MUST supply an explicitly chosen username.
    if (!existingUser && !hasUsername) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Username is required when creating a new user account' }) };
    }

    const trimmedUsername = hasUsername ? username.trim() : undefined;

    // 6. Check username uniqueness.
    if (hasUsername) {
      const createUsernameFilter = require('./usernameFilter');
      const duplicateUser = await users.findOne({ ...createUsernameFilter(trimmedUsername), uid: { $ne: uid } });
      if (duplicateUser) {
        return { statusCode: 409, headers, body: JSON.stringify({ error: 'Username is already taken' }) };
      }
    }

    // 7. Update the existing user or create a new one.
    const updateFields = { email: email.trim() };
    if (hasUsername) { updateFields.username = trimmedUsername; }
    await users.updateOne(
      { uid },
      {
        $set: updateFields,
        $setOnInsert: {
          userType: 2,
          createdAt: new Date()
        }
      },
      { upsert: true }
    );

    // 8. Retrieve updated document.
    const userDoc = await users.findOne({ uid });
    if (!userDoc) throw new Error('User document could not be retrieved after synchronization');
    if (typeof userDoc.username !== 'string' || !userDoc.username.trim()) {
      throw new Error('User document does not contain a valid username');
    }

    // 9. Return user details.
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        user: {
          uid: userDoc.uid,
          email: userDoc.email,
          username: userDoc.username,
          userPhoto: userDoc.userPhoto || '',
          whatsapp: userDoc.whatsapp || '',
          userType: userDoc.userType,
          institution: userDoc.institution || '',
          designation: userDoc.designation || '',
          status: userDoc.status || '',
          profession: userDoc.profession || '',
          department: userDoc.department || '',
          year: userDoc.year || '',
          age: userDoc.age ?? null,
          gender: userDoc.gender || ''
        }
      })
    };

  } catch (error) {
    console.error('Error syncing user:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Failed to synchronize user with database',
        details: error.message
      })
    };
  }
};
