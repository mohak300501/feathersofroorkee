const {
  connectToDatabase,
  response,
  handleOptions,
  requireMethod,
} = require('./common');

exports.handler = async (event, context) => {
  const options = handleOptions(event);
  if (options) return options;
  const method = requireMethod(event, 'GET');
  if (method) return method;

  try {
    const params = event.queryStringParameters || {};
    const requestedPage = Math.max(parseInt(params.page || '1', 10) || 1, 1);
    const limit = 20;
    const db = await connectToDatabase(context);

    const total = await db.collection('binocTransactions').countDocuments({});
    const totalPages = Math.max(Math.ceil(total / limit), 1);
    const page = Math.min(requestedPage, totalPages);

    const transactions = await db.collection('binocTransactions').aggregate([
      { $sort: { borrowedAt: -1, _id: -1 } },
      { $skip: (page - 1) * limit },
      { $limit: limit },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: 'uid',
          as: 'user',
        },
      },
      {
        $lookup: {
          from: 'binoculars',
          localField: 'binocId',
          foreignField: 'binocId',
          as: 'binocular',
        },
      },
      {
        $unwind: {
          path: '$user',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $unwind: {
          path: '$binocular',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          _id: 0,
          transactionId: 1,
          binocId: 1,
          borrowedAt: 1,
          returnedAt: 1,
          username: { $ifNull: ['$user.username', '$user.email'] },
          physicalId: '$binocular.physicalId',
        },
      },
    ]).toArray();

    return response(200, {
      success: true,
      transactions,
      page,
      limit,
      total,
      totalPages,
    });
  } catch (error) {
    console.error('getTransactions error:', error);
    return response(error.statusCode || 500, {
      error: error.statusCode ? error.message : 'Internal server error',
    });
  }
};
