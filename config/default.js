const path = require('path');
@@@@const host = 'http://localhost:3000';

module.exports = {
    port: 3000,
    schema: path.join(__dirname, '..', 'examples', 'arezzo.json'),
    mongoURI: 'mongodb://localhost:27017',
    host: host,
    authProviders: {
        facebook: {
            Strategy: require('passport-facebook').Strategy,
            options: {
                clientID: 'FACEBOOK_APP_ID',
                clientSecret: 'FACEBOOK_APP_SECRET',
                callbackURL: host + '/auth/facebook/callback'
            },
            callback: function(accessToken, refreshToken, profile){
                return {
                    displayName: profile.name,
                    email : profile.email,
                    picture: profile.picture,
                    identities: {
                        facebook: {
                            id: profile.id,
                            accessToken: accessToken,
                            refreshToken: refreshToken,
                            profile: profile
                        }
                    }
                }
            }
        }
    }
};