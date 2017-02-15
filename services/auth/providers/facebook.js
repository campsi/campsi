const DEFAULT_EXPIRATION = 15;

/**
 *
 * @param {Object} options
 * @param {String} options.clientID
 * @param {String} options.clientSecret
 * @param {String} options.baseUrl
 * @param {String} [options.title]
 * @param {Number} [options.order]
 * @param {Number} [options.expiration]
 * @returns AuthProviderConfig
 */
module.exports = function (options) {
    return {
        Strategy: require('passport-facebook').Strategy,
        expiration: options.expiration || DEFAULT_EXPIRATION,
        order: options.order,
        title: options.title || 'Facebook',
        colors: {
            background: '#3b5998',
            text: '#fff'
        },
        options: {
            clientID: options.clientID,
            clientSecret: options.clientSecret,
            callbackURL: options.baseUrl + '/facebook/callback',
            profileFields: ['id', 'displayName', 'locale', 'timezone', 'email']
        },
        callback: function (req, accessToken, refreshToken, profile, done) {
            done(null, {
                displayName: profile._json.name,
                email: profile._json.email,
                picture: profile.picture,
                identity: profile._json
            });
        }
    };
};
