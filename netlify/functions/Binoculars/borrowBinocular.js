const crypto = require('crypto');
const {
  connectToDatabase,
  response,
  handleOptions,
  requireMethod,
  requireUser,
  ensureIndexes,
} = require('./common');

exports.handler = async (event, context) => {
  const options = handleOptions(event);
  if (options) return options;
  const method = requireMethod(event, 'POST');
  if (method) return method;

  try {
    const { userId, binocId } = JSON.parse(event.body || '{}');
    const db = await connectToDatabase(context);
    await ensureIndexes(db);
    await requireUser(db, userId);

    const binocular = await db.collection('binoculars').findOne({ binocId });
    if (!binocular) return response(404, { error: 'Binocular not found' });

    const openTransaction = await db.collection('binocTransactions').findOne({
      binocId,
      returnedAt: null,
    });
    if (openTransaction) {
      return response(409, {
        error: openTransaction.userId === userId
          ? 'You already have this binocular borrowed'
          : 'This binocular is currently unavailable',
      });
    }

    const transaction = {
      transactionId: crypto.randomUUID(),
      binocId,
      userId,
      borrowedAt: new Date(),
      returnedAt: null,
    };

    try {
      await db.collection('binocTransactions').insertOne(transaction);
    } catch (error) {
      if (error?.code === 11000) {
        return response(409, { error: 'This binocular was just borrowed by another user. Please scan again.' });
      }
      throw error;
    }

    return response(200, { success: true, transactionId: transaction.transactionId });
  } catch (error) {
    console.error('borrowBinocular error:', error);
    return response(error.statusCode || 500, {
      error: error.statusCode ? error.message : 'Internal server error',
    });
  }
};
