const {
  connectToDatabase,
  response,
  handleOptions,
  requireMethod,
  requireAdmin,
  ensureIndexes,
} = require('./common');
const { getAuthenticatedUserId } = require('../firebaseAdmin');

exports.handler = async (event, context) => {
  const options = handleOptions(event);
  if (options) return options;
  const method = requireMethod(event, 'POST');
  if (method) return method;

  try {
    const { binocId } = JSON.parse(event.body || '{}');
    const userId = await getAuthenticatedUserId(event);
    if (!userId) return response(401, { error: 'Authentication required' });
    const db = await connectToDatabase(context);
    await ensureIndexes(db);
    await requireAdmin(db, userId);

    const binocular = await db.collection('binoculars').findOne({ binocId });
    if (!binocular) return response(404, { error: 'Binocular not found' });

    const transactionCount = await db.collection('binocTransactions').countDocuments({ binocId });
    if (transactionCount > 0) {
      return response(409, {
        error: 'This binocular has transaction history and cannot be deleted.',
      });
    }

    await db.collection('binoculars').deleteOne({ binocId });
    return response(200, { success: true });
  } catch (error) {
    console.error('deleteBinocular error:', error);
    return response(error.statusCode || 500, {
      error: error.statusCode ? error.message : 'Internal server error',
    });
  }
};
