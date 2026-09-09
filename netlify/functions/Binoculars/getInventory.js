const {
  connectToDatabase,
  response,
  handleOptions,
  requireMethod,
  ensureIndexes,
} = require('./common');

exports.handler = async (event, context) => {
  const options = handleOptions(event);
  if (options) return options;
  const method = requireMethod(event, 'GET');
  if (method) return method;

  try {
    const db = await connectToDatabase(context);
    await ensureIndexes(db);

    const binoculars = await db.collection('binoculars').find({}).project({
      binocId: 1,
      make: 1,
    }).toArray();

    const ids = binoculars.map(b => b.binocId);
    const openTransactions = ids.length
      ? await db.collection('binocTransactions')
          .find({ binocId: { $in: ids }, returnedAt: null })
          .project({ binocId: 1 })
          .toArray()
      : [];

    const borrowedIds = new Set(openTransactions.map(t => t.binocId));
    const buckets = new Map();

    for (const binoc of binoculars) {
      const row = buckets.get(binoc.make) || { make: binoc.make, available: 0, total: 0 };
      row.total += 1;
      if (!borrowedIds.has(binoc.binocId)) row.available += 1;
      buckets.set(binoc.make, row);
    }

    return response(200, {
      success: true,
      inventory: [...buckets.values()].sort((a, b) => a.make.localeCompare(b.make)),
    });
  } catch (error) {
    console.error('getInventory error:', error);
    return response(error.statusCode || 500, {
      error: error.statusCode ? error.message : 'Internal server error',
    });
  }
};
