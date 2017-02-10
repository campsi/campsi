'use strict';

/**
 *
 * @param {Object} options
 * @param {String} options.clientID
 * @param {String} options.clientSecret
 * @param {String} options.baseUrl
 * @param {String} [options.title]
 * @param {String} [options.order]
 * @returns AuthProviderConfig
 */
module.exports = function (options) {
    return {
        Strategy: require('passport-google-oauth20').Strategy,
        order: options.order,
        options: {
            clientID: options.clientID,
            clientSecret: options.clientSecret,
            callbackURL: options.baseUrl + '/google/callback'
        },
        title: options.title || 'Google',
        scope: ['profile', 'email'],
        callback: function (req, accessToken, refreshToken, profile, done) {
            //noinspection JSUnresolvedVariable
            done(null, {
                displayName: profile._json.displayName,
                email: profile._json.emails[0].value,
                picture: profile._json.image.url,
                identity: profile._json
            });
        }
    };
};