'use strict';

const ObjectID = require('mongodb').ObjectID;
const helpers = require('../modules/responseHelpers');

/**
 *
 * @param {Schema} schema
 * @param {Object} [db]
 * @returns {middleware}
 */
module.exports = function parseParams(schema, db) {

    function middleware(req, res, next) {

        req.schema = schema;

        if (req.params.resource) {

            req.resource = schema.resources[req.params.resource];

            if (!req.resource) {
                return helpers.notFound(res);
            }

            if (req.params.id) {
                try {
                    req.filter = {_id: ObjectID(req.params.id)};
                } catch (err) {
                    return helpers.notFound(res);
                }
            }

            if (req.params.state) {
                if (typeof req.resource.states[req.params.state] === 'undefined') {
                    return helpers.notFound(res);
                }
                req.state = req.params.state;
            } else {
                req.state = req.resource.defaultState;
            }
        }

        if (req.params.role && typeof schema.roles[req.params.role] === 'undefined') {
            return helpers.notFound(res);
        }

        next();
    }

    return middleware;
};