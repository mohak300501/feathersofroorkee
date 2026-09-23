const {
  connectToDatabase,
  response,
  handleOptions,
  requireMethod,
  requireUser,
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
    await requireUser(db, userId);

    const transaction = await db.collection('binocTransactions').findOne({
      binocId,
      userId,
      returnedAt: null,
    });

    if (!transaction) {
      return response(409, {
        error: 'You do not have an active transaction for this binocular',
      });
    }

    const result = await db.collection('binocTransactions').updateOne(
      { transactionId: transaction.transactionId, userId, returnedAt: null },
      { $set: { returnedAt: new Date() } }
    );

    if (!result.modifiedCount) {
      return response(409, { error: 'This transaction has already been returned' });
    }

    return response(200, { success: true });
  } catch (error) {
    console.error('returnBinocular error:', error);
    return response(error.statusCode || 500, {
      error: error.statusCode ? error.message : 'Internal server error',
    });
  }
};
