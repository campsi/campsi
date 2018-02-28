const debug = require('debug')('campsi');
const {ObjectID} = require('mongodb');

/**
 *
 * @param str
 * @returns {undefined|ObjectID}
 */
module.exports = function createObjectID (str) {
  let oid;
  try {
    oid = ObjectID(str);
  } catch (err) {
    debug('wrong object id %s', str);
  }
  return oid;
};
