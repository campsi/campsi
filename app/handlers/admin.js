'use strict';

const forIn = require('for-in');
const helpers = require('../modules/responseHelpers');
const builder = require('../modules/queryBuilder');

module.exports.getResources = (req, res) => {
    let resources = [];
    forIn(req.schema.resources, (resource, id)=> {
        resources.push({
            id: id,
            label: resource.label
        })
    });
    helpers.json(res, resources);
};

/**
 *
 * @param req
 * @param {Resource} req.resource
 * @param res
 */
module.exports.getResource = (req, res) => {
    const cursor = req.resource.collection.find({});
    let schema = {
        label: req.resource.label,
        states: req.resource.states,
        defaultState: req.resource.defaultState,
        permissions: req.resource.permissions,
        fields: req.resource.fields,
        docs: []
    };
    cursor.count((countErr, count)=> {
        cursor.skip(0).limit(100).toArray((err, docs) => {
            if (helpers.error(err) || helpers.error(countErr)) return;
            schema.docs = docs;
            schema.count = count;
            helpers.json(res, schema);
        });
    });
};

module.exports.createInvitation = (req, res) => {
    const now = new Date();
    const exp = new Date(now.getTime() + 10 * 24 * 60);
    const defaults = {
        expiration: exp,
        unique: true
    };

    if(!req.body.role || !req.schema.roles[req.body.role]){
        return helpers.error(res, 'missing role');
    }

    const invitation = Object.assign({}, defaults, req.body);

    req.db.collection('__invitations__', (err, collection)=> {
        collection.insert(invitation, (err, result)=> {
            helpers.json(res, result.ops[0]);
        });
    });
};

module.exports.listUsers = (req, res)=> helpers.notImplemented(res);
module.exports.createUser = (req, res)=> helpers.notImplemented(res);
