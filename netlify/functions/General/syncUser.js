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
    const { uid, email, username } = JSON.parse(event.body);

    if (!uid || !email) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing required fields' }),
      };
    }

    const db = await connectToDatabase(context);
    
    // Check if user exists
    let userDoc = await db.collection('users').findOne({ uid });

    if (!userDoc) {
      // Create new user (isAdmin defaults to false)
      const newUser = {
        uid,
        email,
        username: username || email.split('@')[0],
        isAdmin: false,
        createdAt: new Date()
      };
      
      await db.collection('users').insertOne(newUser);
      userDoc = newUser;
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        user: {
          uid: userDoc.uid,
          email: userDoc.email,
          username: userDoc.username,
          isAdmin: userDoc.isAdmin,
          institution: userDoc.institution || '',
          role: userDoc.role || '',
          profession: userDoc.profession || '',
          department: userDoc.department || '',
          age: userDoc.age ?? null,
          gender: userDoc.gender || ''
        }
      }),
    };

  } catch (error) {
    console.error('Error syncing user:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error', details: error.message, stack: error.stack }),
    };
  }
};
