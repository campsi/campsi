'use strict';

const ObjectID = require('mongodb').ObjectID;
const helpers = require('../helpers');

/**
 *
 * @param {Schema} schema
 * @returns {middleware}
 */
module.exports = function parseParams(schema) {

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
        next();
    }

    return middleware;
};