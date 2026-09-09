const {
  connectToDatabase,
  response,
  handleOptions,
  requireMethod,
  requireAdmin,
  ensureIndexes,
  publicBinocular,
} = require('./common');

exports.handler = async (event, context) => {
  const options = handleOptions(event);
  if (options) return options;
  const method = requireMethod(event, 'GET');
  if (method) return method;

  try {
    const params = event.queryStringParameters || {};
    const db = await connectToDatabase(context);
    await ensureIndexes(db);
    await requireAdmin(db, params.userId);

    const binoculars = await db.collection('binoculars')
      .find({})
      .sort({ addedAt: -1 })
      .toArray();

    return response(200, {
      success: true,
      binoculars: binoculars.map(publicBinocular),
    });
  } catch (error) {
    console.error('getBinoculars error:', error);
    return response(error.statusCode || 500, {
      error: error.statusCode ? error.message : 'Internal server error',
    });
  }
};
