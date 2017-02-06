const {ObjectID} = require('mongodb');

/**
 *
 * @param str
 * @returns {undefined|ObjectID}
 */
module.exports = function createObjectID(str) {
    let oid;
    try {
        oid = ObjectID(str);
    } catch (err) {
        console.error('wrong object id', str);
    }
    return oid;
};