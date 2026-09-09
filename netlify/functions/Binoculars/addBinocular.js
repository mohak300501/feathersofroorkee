const crypto = require('crypto');
const {
  connectToDatabase,
  response,
  handleOptions,
  requireMethod,
  requireAdmin,
  ensureIndexes,
  encryptBinocularPayload,
  validateString,
} = require('./common');

exports.handler = async (event, context) => {
  const options = handleOptions(event);
  if (options) return options;
  const method = requireMethod(event, 'POST');
  if (method) return method;

  try {
    const { userId, make: rawMake, physicalId: rawPhysicalId } = JSON.parse(event.body || '{}');
    const make = validateString(rawMake, 'Make');
    const physicalId = validateString(rawPhysicalId, 'Physical ID');

    const db = await connectToDatabase(context);
    await ensureIndexes(db);
    await requireAdmin(db, userId);

    const existing = await db.collection('binoculars').findOne({ physicalId });
    if (existing) return response(409, { error: 'A binocular with this Physical ID already exists' });

    const binocId = crypto.randomUUID();
    const addedAt = new Date();
    const payload = {
      binocId,
      make,
      physicalId,
      addedAt: addedAt.toISOString(),
    };
    const hash = encryptBinocularPayload(payload);

    await db.collection('binoculars').insertOne({
      ...payload,
      addedAt,
      hash,
    });

    return response(200, {
      success: true,
      binocular: { binocId, make, physicalId, addedAt, hash },
    });
  } catch (error) {
    console.error('addBinocular error:', error);
    return response(error.statusCode || 500, {
      error: error.statusCode ? error.message : 'Internal server error',
    });
  }
};
