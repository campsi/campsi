/**
 *
 * @param options
 * @param {String} options.title
 * @param {String} options.salt
 * @param {Number} options.order
 * @returns AuthProviderConfig
 */
module.exports = function (options) {
    return {
        Strategy: require('passport-local'),
        title: options.title,
        order: options.order,
        options: {
            verify: true,
            salt: options.salt
        }
    };
};