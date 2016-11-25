const path = require('path');
const host = 'http://localhost:3000';

module.exports = {
    port: 3000,
    schema: path.join(__dirname, '..', 'examples', 'arezzo.json'),
    mongoURI: 'mongodb://localhost:27017',
    host: host,
    handlers: {
        '/admin': 'admin',
        '/auth': 'auth',
        '/assets': 'assets',
        '/searches': 'search',
        '/docs': 'docs'
    },
    multerOptions: {
        dest: path.join(__dirname, '..', 'data')
    },
    authProviders: {
        local: {
            Strategy: require('passport-local'),
            title: 'Local',
            order: 1,
            options: {
                verify: true,
                salt: 'LOCAL_PASSWORD_SALT'
            }
        },
        twitter: {
            order: 5,
            title: 'Twitter',
            Strategy: require('passport-twitter').Strategy,
            options: {
                consumerKey: 'TWITTER_CONSUMER_KEY',
                consumerSecret: 'TWITTER_CONSUMER_SECRET',
                callbackURL: host + '/auth/twitter/callback',
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
        },
        google: {
            Strategy: require('passport-google-oauth20').Strategy,
            order: 2,
            options: {
                clientID: 'GOOGLE_CLIENT_ID',
                clientSecret: 'GOOGLE_CLIENT_SECRET',
                callbackURL: host + '/auth/google/callback'
            },
            title: 'Google',
            buttonStyle: {
                backgroundColor: '#dd4b39',
                textShadow: '1px 1px 2px rgba(0,0,0,0.5)',
                color: '#fff'
            },
            scope: ['profile', 'email'],
            callback: function (req, accessToken, refreshToken, profile, done) {
                done(null, {
                    displayName: profile._json.displayName,
                    email: profile._json.emails[0].value,
                    picture: profile._json.image.url,
                    identity: profile._json
                })
            }
        },
        facebook: {
            Strategy: require('passport-facebook').Strategy,
            expiration: 15,
            order: 3,
            title: 'Facebook',
            buttonStyle: {
                background: '#3b5998',
                color: '#fff'
            },
            options: {
                clientID: 'FACEBOOK_CLIENT_ID',
                clientSecret: 'FACEBOOK_CLIENT_SECRET',
                callbackURL: host + '/auth/facebook/callback',
                profileFields: ['id', 'displayName', 'locale', 'timezone', 'email']
            },
            callback: function (req, accessToken, refreshToken, profile, done) {
                done(null, {
                    displayName: profile._json.name,
                    email: profile._json.email,
                    picture: profile.picture,
                    identity: profile._json
                })
            }
        },
        github: {
            Strategy: require('passport-github2').Strategy,
            order: 4,
            title: 'Github',
            buttonStyle: {
                backgroundColor: '#CCC',
                color: '#000'
            },
            options: {
                clientID: 'GITHUB_CLIENT_ID',
                clientSecret: 'GITHUB_CLIENT_SECRET',
                callbackURL: host + "/auth/github/callback"
            },
            scope: ['user', 'gist', 'public_repo'],
            callback: function (req, accessToken, refreshToken, profile, done) {
                done(null, {
                    displayName: profile._json.name,
                    email: profile.emails[0].value,
                    picture: profile._json.avatar_url,
                    identity: profile._json
                })
            }
        }
    }
};