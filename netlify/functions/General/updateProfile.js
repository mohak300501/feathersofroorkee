const { connectToDatabase } = require('./db');

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
    const { uid, username, optionalInfo } = JSON.parse(event.body);

    if (!uid) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing uid' }),
      };
    }

    const db = await connectToDatabase(context);

    // Check if the username is already taken by a DIFFERENT user
    if (username) {
      const existingUser = await db.collection('users').findOne({
        username: { $regex: new RegExp(`^${username}$`, 'i') },
        uid: { $ne: uid }
      });

      if (existingUser) {
        return {
          statusCode: 409,
          headers,
          body: JSON.stringify({ error: 'Username is already taken' }),
        };
      }
    }

    const setFields = {};
    if (username !== undefined) { setFields.username = username; }
    if (optionalInfo !== undefined) {
      const { institution, role, profession, department, age, gender, } = optionalInfo || {};
      setFields.institution = institution ?? '';
      setFields.role = role ?? '';
      // Profession and Department are mutually exclusive.
      if (role === 'Other') {
        setFields.profession = profession ?? '';
        setFields.department = '';
      } else {
        setFields.profession = '';
        setFields.department = department ?? '';
      }
      setFields.age = age === '' || age === null || age === undefined ? null : Number(age);
      setFields.gender = gender ?? '';
    }

    const updateResult = await db.collection('users').updateOne(
      { uid },
      { $set: setFields }
    );

    if (updateResult.matchedCount === 0) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'User not found' }),
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Profile updated successfully'
      }),
    };

  } catch (error) {
    console.error('Error updating profile:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error', details: error.message }),
    };
  }
};
