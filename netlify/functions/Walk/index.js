const addWalk = require('./addWalk');
const getWalks = require('./getWalks');
const getWalk = require('./getWalk');
const editWalk = require('./editWalk');
const deleteWalk = require('./deleteWalk');
const registerWalk = require('./registerWalk');
const cancelWalkRegistration = require('./cancelWalkRegistration');
const getWalkRegistrations = require('./getWalkRegistrations');
const addWalkPhoto = require('./addWalkPhoto');
const editWalkPhoto = require('./editWalkPhoto');
const deleteWalkPhoto = require('./deleteWalkPhoto');
const addWalkExperience = require('./addWalkExperience');
const editWalkExperience = require('./editWalkExperience');
const deleteWalkExperience = require('./deleteWalkExperience');

exports.handler = async (event, context) => {
  const action = event.path.split('/').pop();

  switch (action) {
    case 'addWalk': return addWalk.handler(event, context);
    case 'getWalks': return getWalks.handler(event, context);
    case 'getWalk': return getWalk.handler(event, context);
    case 'editWalk': return editWalk.handler(event, context);
    case 'deleteWalk': return deleteWalk.handler(event, context);
    case 'registerWalk': return registerWalk.handler(event, context);
    case 'cancelWalkRegistration': return cancelWalkRegistration.handler(event, context);
    case 'getWalkRegistrations': return getWalkRegistrations.handler(event, context);
    case 'addWalkPhoto': return addWalkPhoto.handler(event, context);
    case 'editWalkPhoto': return editWalkPhoto.handler(event, context);
    case 'deleteWalkPhoto': return deleteWalkPhoto.handler(event, context);
    case 'addWalkExperience': return addWalkExperience.handler(event, context);
    case 'editWalkExperience': return editWalkExperience.handler(event, context);
    case 'deleteWalkExperience': return deleteWalkExperience.handler(event, context);
    default:
      return { statusCode: 404, body: JSON.stringify({ error: 'Function action not found in Walk' }) };
  }
};
