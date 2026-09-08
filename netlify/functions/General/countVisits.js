const { connectToDatabase } = require('./db');

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
  };

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const db = await connectToDatabase(context);

    await db.collection('visits').updateOne(
      { _id: 'global' },
      {
        $inc: { count: 1 },
        $set: { updatedAt: new Date() }
      },
      { upsert: true }
    );

    return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
  } catch (err) {
    console.error(err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Failed to record visit',
        details: err.message,
      }),
    };
  }
};