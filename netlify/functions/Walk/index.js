const addWalk = require('./addWalk');
const getWalks = require('./getWalks');
const getWalk = require('./getWalk');
const editWalk = require('./editWalk');
const deleteWalk = require('./deleteWalk');
const registerWalk = require('./registerWalk');
const addWalkPhoto = require('./addWalkPhoto');

exports.handler = async (event, context) => {
  const action = event.path.split('/').pop();

  switch (action) {
    case 'addWalk': return addWalk.handler(event, context);
    case 'getWalks': return getWalks.handler(event, context);
    case 'getWalk': return getWalk.handler(event, context);
    case 'editWalk': return editWalk.handler(event, context);
    case 'deleteWalk': return deleteWalk.handler(event, context);
    case 'registerWalk': return registerWalk.handler(event, context);
    case 'addWalkPhoto': return addWalkPhoto.handler(event, context);
    default:
      return { statusCode: 404, body: JSON.stringify({ error: 'Function action not found in Walk' }) };
  }
};
