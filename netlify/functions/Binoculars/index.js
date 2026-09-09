const addBinocular = require('./addBinocular');
const editBinocular = require('./editBinocular');
const deleteBinocular = require('./deleteBinocular');
const getBinoculars = require('./getBinoculars');
const getInventory = require('./getInventory');
const getTransactions = require('./getTransactions');
const scanBinocular = require('./scanBinocular');
const borrowBinocular = require('./borrowBinocular');
const returnBinocular = require('./returnBinocular');

exports.handler = async (event, context) => {
  const action = event.path.split('/').pop();
  switch (action) {
    case 'addBinocular': return addBinocular.handler(event, context);
    case 'editBinocular': return editBinocular.handler(event, context);
    case 'deleteBinocular': return deleteBinocular.handler(event, context);
    case 'getBinoculars': return getBinoculars.handler(event, context);
    case 'getInventory': return getInventory.handler(event, context);
    case 'getTransactions': return getTransactions.handler(event, context);
    case 'scanBinocular': return scanBinocular.handler(event, context);
    case 'borrowBinocular': return borrowBinocular.handler(event, context);
    case 'returnBinocular': return returnBinocular.handler(event, context);
    default: return { statusCode: 404, body: JSON.stringify({ error: 'Function action not found in Binoculars' }) };
  }
};
