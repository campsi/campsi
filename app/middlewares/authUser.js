'use strict';

const helpers = require('../helpers');

/**
 *
 * @param {User} user
 * @param {String} method
 * @param {Resource} resource
 * @param {String} [state]
 * @returns {Boolean}
 */
function can(user, method, resource, state) {
    if(typeof resource === 'undefined'){
        return true;
    }

    let role = (typeof user === 'undefined') ? 'public' : user.role;
    let permission = resource.permissions[role][state];
    return (permission && (permission.indexOf(method) > -1 || permission === '*'));
}

module.exports = function authUser(config, db) {
    return (req, res, next)=> {
        if (req.authorization.basic) {
            let email = req.authorization.basic.username;
            if (typeof config.users[email] !== 'undefined') {
                req.user = config.users[email];
            }
        }

        can(req.user, req.method, req.resource, req.state)
            ? next()
            : helpers.unauthorized(res);
    }
};