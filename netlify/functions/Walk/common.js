async function getBookedSlots(db, walk) {
  const [result] = await db.collection('walkRegistrations').aggregate([
    {
      $match: {
        walkId: { $in: [walk._id.toString(), walk.walkCode] }
      }
    },
    {
      $group: {
        _id: null,
        bookedSlots: {
          $sum: { $ifNull: ['$slots', { $ifNull: ['$members', 1] }] }
        }
      }
    }
  ]).toArray();

  return result?.bookedSlots || 0;
}

module.exports = { getBookedSlots };
