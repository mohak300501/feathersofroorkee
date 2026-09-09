const {
  connectToDatabase,
  response,
  handleOptions,
  requireMethod,
  requireAdmin,
  ensureIndexes,
  encryptBinocularPayload,
  publicBinocular,
  validateString,
} = require('./common');

exports.handler = async (event, context) => {
  const options = handleOptions(event);
  if (options) return options;
  const method = requireMethod(event, 'POST');
  if (method) return method;

  try {
    const {
      userId,
      binocId,
      make: rawMake,
      physicalId: rawPhysicalId,
    } = JSON.parse(event.body || '{}');

    const make = validateString(rawMake, 'Make');
    const physicalId = validateString(rawPhysicalId, 'Physical ID');

    const db = await connectToDatabase(context);
    await ensureIndexes(db);
    await requireAdmin(db, userId);

    const binocular = await db.collection('binoculars').findOne({ binocId });
    if (!binocular) return response(404, { error: 'Binocular not found' });

    const duplicate = await db.collection('binoculars').findOne({
      physicalId,
      binocId: { $ne: binocId },
    });
    if (duplicate) return response(409, { error: 'Another binocular already uses this Physical ID' });

    const payload = {
      binocId: binocular.binocId,
      make,
      physicalId,
      addedAt: new Date(binocular.addedAt).toISOString(),
    };
    const hash = encryptBinocularPayload(payload);

    await db.collection('binoculars').updateOne(
      { binocId },
      {
        $set: { make, physicalId, hash },
      }
    );

    return response(200, {
      success: true,
      binocular: publicBinocular({ ...binocular, make, physicalId, hash }),
    });
  } catch (error) {
    console.error('editBinocular error:', error);
    return response(error.statusCode || 500, {
      error: error.statusCode ? error.message : 'Internal server error',
    });
  }
};
