const { connectToDatabase } = require('./db');

const normalizedValue = (field) => ({
  $let: {
    vars: {
      value: {
        $trim: {
          input: {
            $convert: {
              input: { $ifNull: [`$${field}`, ''] },
              to: 'string',
              onError: '',
              onNull: ''
            }
          }
        }
      }
    },
    in: { $cond: [{ $eq: ['$$value', ''] }, 'Blank', '$$value'] }
  }
});

const groupCounts = (field) => [
  { $group: { _id: `$${field}`, count: { $sum: 1 } } },
  { $sort: { count: -1, _id: 1 } }
];

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const db = await connectToDatabase(context);
    const [stats] = await db.collection('users').aggregate([
      {
        $project: {
          institution: normalizedValue('institution'),
          designation: normalizedValue('designation'),
          status: normalizedValue('status'),
          profession: normalizedValue('profession'),
          department: normalizedValue('department'),
          year: normalizedValue('year'),
          gender: normalizedValue('gender'),
          ageValue: {
            $convert: {
              input: {
                $cond: [
                  {
                    $eq: [
                      {
                        $trim: {
                          input: {
                            $convert: {
                              input: { $ifNull: ['$age', ''] },
                              to: 'string',
                              onError: '',
                              onNull: ''
                            }
                          }
                        }
                      },
                      ''
                    ]
                  },
                  null,
                  '$age'
                ]
              },
              to: 'double',
              onError: null,
              onNull: null
            }
          }
        }
      },
      {
        $project: {
          institution: 1,
          designation: 1,
          status: 1,
          profession: 1,
          department: 1,
          year: 1,
          gender: 1,
          age: {
            $switch: {
              branches: [
                { case: { $and: [{ $gte: ['$ageValue', 6] }, { $lt: ['$ageValue', 13] }] }, then: '6-12' },
                { case: { $and: [{ $gte: ['$ageValue', 13] }, { $lt: ['$ageValue', 19] }] }, then: '13-18' },
                { case: { $and: [{ $gte: ['$ageValue', 19] }, { $lt: ['$ageValue', 25] }] }, then: '19-25' },
                { case: { $and: [{ $gte: ['$ageValue', 25] }, { $lt: ['$ageValue', 41] }] }, then: '25-40' },
                { case: { $and: [{ $gte: ['$ageValue', 41] }, { $lt: ['$ageValue', 51] }] }, then: '41-50' },
                { case: { $and: [{ $gte: ['$ageValue', 51] }, { $lt: ['$ageValue', 65] }] }, then: '51-65' },
                { case: { $gte: ['$ageValue', 65] }, then: '65+' }
              ],
              default: 'Blank'
            }
          },
          hasProfileDetails: {
            $or: [
              { $ne: ['$institution', 'Blank'] },
              { $ne: ['$designation', 'Blank'] },
              { $ne: ['$status', 'Blank'] },
              { $ne: ['$profession', 'Blank'] },
              { $ne: ['$department', 'Blank'] },
              { $ne: ['$year', 'Blank'] },
              { $ne: ['$gender', 'Blank'] },
              { $ne: ['$ageValue', null] }
            ]
          }
        }
      },
      {
        $facet: {
          total: [{ $count: 'count' }],
          institution: groupCounts('institution'),
          designation: groupCounts('designation'),
          status: groupCounts('status'),
          profession: groupCounts('profession'),
          department: groupCounts('department'),
          year: groupCounts('year'),
          gender: groupCounts('gender'),
          age: groupCounts('age'),
          profileDetails: [
            { $group: { _id: '$hasProfileDetails', count: { $sum: 1 } } }
          ]
        }
      }
    ]).toArray();

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        total: stats?.total[0]?.count ?? 0,
        institution: stats?.institution ?? [],
        designation: stats?.designation ?? [],
        status: stats?.status ?? [],
        profession: stats?.profession ?? [],
        department: stats?.department ?? [],
        year: stats?.year ?? [],
        gender: stats?.gender ?? [],
        age: stats?.age ?? [],
        profileDetails: stats?.profileDetails ?? []
      }),
    };
  } catch (error) {
    console.error('Error fetching user demographic stats:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};
