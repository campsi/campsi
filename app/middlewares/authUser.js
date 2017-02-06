'use strict';

const helpers = require('../modules/responseHelpers');
const passport = require('passport');
const BearerStrategy = require('passport-http-bearer').Strategy;

/**
 *
 * @param {User} user
 * @param {String} method
 * @param {Resource} resource
 * @param {String} [state]
 * @returns {Boolean}
 */
function can(user, method, resource, state) {

    if (typeof resource === 'undefined') {
        return true;
    }

    let roles = (typeof user === 'undefined') ? 'public' : user.role;

    if (!Array.isArray(roles)) {
        roles = [roles];
    }

    let success = false;

    roles.forEach((role)=> {
        let permission = resource.permissions[role][state];
        if (permission && (permission.indexOf(method) > -1 || permission === '*')) {
            success = true;
        }
    });

    return success;
}


function end(req, res, next){
    return can(req.user, req.method, req.resource, req.state)
        ? next()
        : helpers.unauthorized(res);
}
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
                end(req, res, next);
            });
        } else {
            end(req, res, next);
        }
    }
};