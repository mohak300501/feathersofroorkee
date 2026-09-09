const {
  connectToDatabase,
  response,
  handleOptions,
  requireMethod,
  requireUser,
  ensureIndexes,
  decryptBinocularPayload,
  publicBinocular,
} = require('./common');

exports.handler = async (event, context) => {
  const options = handleOptions(event);
  if (options) return options;
  const method = requireMethod(event, 'POST');
  if (method) return method;

  try {
    const { userId, payload } = JSON.parse(event.body || '{}');
    const db = await connectToDatabase(context);
    await ensureIndexes(db);
    await requireUser(db, userId);

    let decrypted;
    try {
      decrypted = decryptBinocularPayload(payload);
    } catch {
      return response(400, { error: 'Invalid or unreadable binocular QR code' });
    }

    if (!decrypted?.binocId || !decrypted?.make || !decrypted?.physicalId || !decrypted?.addedAt) {
      return response(400, { error: 'Invalid binocular QR payload' });
    }

    const binocular = await db.collection('binoculars').findOne({
      binocId: decrypted.binocId,
      make: decrypted.make,
      physicalId: decrypted.physicalId,
    });

    if (!binocular || binocular.hash !== payload) {
      return response(404, { error: 'This binocular QR code is not registered or is no longer valid' });
    }

    const openTransaction = await db.collection('binocTransactions').findOne({
      binocId: binocular.binocId,
      returnedAt: null,
    });

    let status = 'Available';
    if (openTransaction) {
      status = openTransaction.userId === userId ? 'Borrowed' : 'Unavailable';
    }

    return response(200, {
      success: true,
      binocular: {
        ...publicBinocular(binocular),
        status,
        currentTransactionId: openTransaction?.transactionId || null,
      },
    });
  } catch (error) {
    console.error('scanBinocular error:', error);
    return response(error.statusCode || 500, {
      error: error.statusCode ? error.message : 'Internal server error',
    });
  }
};
