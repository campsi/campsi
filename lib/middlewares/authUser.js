const passport = require('passport');
const BearerStrategy = require('passport-http-bearer').Strategy;

/**
 *
 * @param {CampsiServer} server
 * @returns {Function}
 */
module.exports = function authUser(server) {

    const users = server.db.collection('__users__');

    passport.use(new BearerStrategy(function (token, done) {
        let query = {};
        query['token.value'] = token;
        query['token.expiration'] = {$gt: new Date()};
        users.findOne(query, (err, user)=> {
            if (err || !user) {
                return done(err);
            }
            return done(null, user, {scope: 'all'});
        });
    }));

    return (req, res, next)=> {
        if (req.headers.authorization || req.query.access_token) {
            //noinspection JSUnresolvedFunction
            passport.authenticate('bearer', {session: false})(req, res, function(){
                next();
            });
        } else {
            next();
        }
    };
};
