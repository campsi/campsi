const helpers = require('../../lib/modules/responseHelpers');
const createObjectID = require('../../lib/modules/createObjectID');

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

module.exports = function onResourceParam(schema) {
    return (req, res, next) => {
        if (req.params.resource) {
            req.resource = schema.resources[req.params.resource];

            if (!req.resource) {
                return helpers.notFound(res);
            }

            const state = req.params.state || req.query.state;

            if (state) {
                if (typeof req.resource.states[state] === 'undefined') {
                    return helpers.notFound(res);
                }
                req.state = state;
            } else {
                req.state = req.resource.defaultState;
            }

            if(!can(req.user, req.method, req.resource, req.state)) {
                return helpers.unauthorized(res);
            }

            if (req.params.id) {
                req.filter = {_id: createObjectID(req.params.id)};
                if(!req.filter._id){
                    return helpers.badRequest(res);
                }
            }
        }

        if (req.params.role && typeof schema.roles[req.params.role] === 'undefined') {
            return helpers.notFound(res);
        }
        next();
    };
};
