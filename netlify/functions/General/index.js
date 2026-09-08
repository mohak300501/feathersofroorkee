const checkUsername = require('./checkUsername');
const countVisits = require('./countVisits');
const getEmailByUsername = require('./getEmailByUsername');
const leaderBoard = require('./leaderBoard');
const publicStats = require('./publicStats');
const syncUser = require('./syncUser');
const updateProfile = require('./updateProfile');

const getUsers = require('./getUsers');

exports.handler = async (event, context) => {
  const action = event.path.split('/').pop();

  switch (action) {
    case 'checkUsername': return checkUsername.handler(event, context);
    case 'countVisits': return countVisits.handler(event, context);
    case 'getEmailByUsername': return getEmailByUsername.handler(event, context);
    case 'leaderBoard': return leaderBoard.handler(event, context);
    case 'publicStats': return publicStats.handler(event, context);
    case 'syncUser': return syncUser.handler(event, context);
    case 'updateProfile': return updateProfile.handler(event, context);
    case 'getUsers': return getUsers.handler(event, context);
    default:
      return { statusCode: 404, body: JSON.stringify({ error: 'Function action not found in General' }) };
  }
};
