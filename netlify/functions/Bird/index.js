const addBird = require('./addBird');
const addBirdPhoto = require('./addBirdPhoto');
const addBirdSighting = require('./addBirdSighting');
const addFamily = require('./addFamily');
const deleteBird = require('./deleteBird');
const deleteBirdPhoto = require('./deleteBirdPhoto');
const deleteBirdSighting = require('./deleteBirdSighting');
const deleteFamily = require('./deleteFamily');
const editBird = require('./editBird');
const editBirdPhoto = require('./editBirdPhoto');
const editBirdSighting = require('./editBirdSighting');
const editFamily = require('./editFamily');
const getBird = require('./getBird');
const getBirds = require('./getBirds');
const getFamilies = require('./getFamilies');
const heartBirdPhoto = require('./heartBirdPhoto')
const setFeaturedPhoto = require('./setFeaturedPhoto');
const switchPhotoSpecies = require('./switchPhotoSpecies');

exports.handler = async (event, context) => {
  // Extract action from path, e.g., /.netlify/functions/Bird/getBird -> getBird
  const action = event.path.split('/').pop();

  switch (action) {
    case 'addBird': return addBird.handler(event, context);
    case 'addBirdPhoto': return addBirdPhoto.handler(event, context);
    case 'addBirdSighting': return addBirdSighting.handler(event, context);
    case 'addFamily': return addFamily.handler(event, context);
    case 'deleteBird': return deleteBird.handler(event, context);
    case 'deleteBirdPhoto': return deleteBirdPhoto.handler(event, context);
    case 'deleteBirdSighting': return deleteBirdSighting.handler(event, context);
    case 'deleteFamily': return deleteFamily.handler(event, context);
    case 'editBird': return editBird.handler(event, context);
    case 'editBirdPhoto': return editBirdPhoto.handler(event, context);
    case 'editBirdSighting': return editBirdSighting.handler(event, context);
    case 'editFamily': return editFamily.handler(event, context);
    case 'getBird': return getBird.handler(event, context);
    case 'getBirds': return getBirds.handler(event, context);
    case 'getFamilies': return getFamilies.handler(event, context);
    case 'heartBirdPhoto': return heartBirdPhoto.handler(event, context);
    case 'setFeaturedPhoto': return setFeaturedPhoto.handler(event, context);
    case 'switchPhotoSpecies': return switchPhotoSpecies.handler(event, context);
    default:
      return { statusCode: 404, body: JSON.stringify({ error: 'Function action not found in Bird' }) };
  }
};
