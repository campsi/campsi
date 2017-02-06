const helpers = require('../../modules/responseHelpers');
const createObjectID = require('../../modules/createObjectID');
module.exports = function onResourceParam(schema) {
    return (req, res, next) => {
        if (req.params.resource) {
            req.resource = schema.resources[req.params.resource];

            if (!req.resource) {
                return helpers.notFound(res);
            }

            if (req.params.id) {
                req.filter = {_id: createObjectID(req.params.id)};
                if(!req.filter._id){
                    return helpers.notFound(res);
                }
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
        }

        if (req.params.role && typeof schema.roles[req.params.role] === 'undefined') {
            return helpers.notFound(res);
        }
        next();
    }
};