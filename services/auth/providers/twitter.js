/**
 *
 * @param {Object} options
 * @param {String} options.consumerKey
 * @param {String} options.consumerSecret
 * @param {String} [options.baseUrl]
 * @param {String} [options.order]
 * @returns AuthProviderConfig
 */
module.exports = function (options) {
    return {
        order: options.order,
        title: 'Twitter',
        Strategy: require('passport-twitter').Strategy,
        options: {
            consumerKey: options.consumerKey,
            consumerSecret: options.consumerSecret,
            callbackURL: options.baseUrl + '/twitter/callback',
            email: true,
            includeEmail: true
        },
        callback: function (req, token, tokenSecret, profile, done) {
            done(null, {
                displayName: profile.displayName,
                email: profile._json.email,
                picture: profile.photos[0].value,
                identity: profile._json
            });
        }
    }
};