const { connectToDatabase } = require('./db');
const createUsernameFilter = require('./usernameFilter');

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
    const { uid, username, whatsapp, optionalInfo } = JSON.parse(event.body);

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
        ...createUsernameFilter(username),
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
    if (whatsapp !== undefined) { setFields.whatsapp = whatsapp; }
    if (optionalInfo !== undefined) {
      const { institution, designation, status, profession, department, year, age, gender, } = optionalInfo || {};
      setFields.institution = institution ?? '';
      setFields.designation = designation ?? '';
      setFields.status = status ?? '';
      // Profession and Department are mutually exclusive.
      if (designation === 'Other') {
        setFields.profession = profession ?? '';
        setFields.department = '';
      } else {
        setFields.profession = '';
        setFields.department = department ?? '';
      }
      if (designation === 'Student') setFields.year = year ?? '';
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
