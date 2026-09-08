const addBird = require('./addBird');
const addBirdPhoto = require('./addBirdPhoto');
const getBird = require('./getBird');
const getBirds = require('./getBirds');
const editBird = require('./editBird');
const deleteBird = require('./deleteBird');
const switchPhotoSpecies = require('./switchPhotoSpecies');
const editPhotoInfo = require('./editPhotoInfo');
const deletePhoto = require('./deletePhoto');
const addFamily = require('./addFamily');
const editFamily = require('./editFamily');
const deleteFamily = require('./deleteFamily');
const getFamilies = require('./getFamilies');
const setFeaturedPhoto = require('./setFeaturedPhoto');

exports.handler = async (event, context) => {
  // Extract action from path, e.g., /.netlify/functions/Bird/getBird -> getBird
  const action = event.path.split('/').pop();

  switch (action) {
    case 'addBird': return addBird.handler(event, context);
    case 'addBirdPhoto': return addBirdPhoto.handler(event, context);
    case 'getBird': return getBird.handler(event, context);
    case 'getBirds': return getBirds.handler(event, context);
    case 'editBird': return editBird.handler(event, context);
    case 'deleteBird': return deleteBird.handler(event, context);
    case 'switchPhotoSpecies': return switchPhotoSpecies.handler(event, context);
    case 'editPhotoInfo': return editPhotoInfo.handler(event, context);
    case 'deletePhoto': return deletePhoto.handler(event, context);
    case 'addFamily': return addFamily.handler(event, context);
    case 'editFamily': return editFamily.handler(event, context);
    case 'deleteFamily': return deleteFamily.handler(event, context);
    case 'getFamilies': return getFamilies.handler(event, context);
    case 'setFeaturedPhoto': return setFeaturedPhoto.handler(event, context);
    default:
      return { statusCode: 404, body: JSON.stringify({ error: 'Function action not found in Bird' }) };
  }
};
