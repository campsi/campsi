'use strict';

/**
 *
 * @param {Object} options
 * @param {String} options.clientID
 * @param {String} options.clientSecret
 * @param {String} options.baseUrl
 * @param {String} options.title
 * @param {Number} options.order
 * @returns AuthProviderConfig
 */
module.exports = function (options) {
    return {
        Strategy: require('passport-github2').Strategy,
        order: options.order,
        title: options.title || 'Github',
        colors: {
            background: '#CCC',
            text: '#000'
        },
        options: {
            clientID: options.clientID,
            clientSecret: options.clientSecret,
            callbackURL: options.baseUrl + '/github/callback'
        },
        scope: ['user', 'gist', 'public_repo'],
        callback: function (req, accessToken, refreshToken, profile, done) {
            //noinspection JSUnresolvedVariable
            done(null, {
                displayName: profile._json.name,
                email: profile.emails[0].value,
                picture: profile._json.avatar_url,
                identity: profile._json
            });
        }
    };
};
