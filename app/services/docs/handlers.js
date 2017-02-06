/**
 * Created by romain on 06/12/2016.
 */
'use strict';

const builder = require('../../modules/queryBuilder');
const helpers = require('../../modules/responseHelpers');
const embedDocs = require('../../modules/embedDocs');
const paginateCursor = require('../../modules/paginateCursor');
const sortCursor = require('../../modules/sortCursor');
const sendWebhook = require('../../modules/sendWebhook');
const forIn = require('for-in');

const onUpdate = (req, res) => (err, result) => {
    if (err) {
        return helpers.error(res, err);
    }

    if (result.modifiedCount !== 1) {
        return helpers.notFound(res);
    }

    const output = {
        id: req.params.id,
        state: req.state,
        data: req.body
    };
    helpers.json(res, output);
    sendWebhook(req, output);
};

module.exports.getDocs = function (req, res) {

    const queryBuilderOptions = {
        resource: req.resource,
        user: req.user,
        query: req.query,
        state: req.state
    };

    const query = builder.find(queryBuilderOptions);
    const fields = builder.select(queryBuilderOptions);

    const cursor = req.resource.collection.find(query, fields);

    let result = {};
    let perPage = req.resource.perPage || 100;
    cursor.count().then((count) => {
        result.count = count;
        result.label = req.resource.label;
        let {skip, limit, page} = paginateCursor(cursor, req.query, {perPage: perPage});
        result.hasNext = result.count > skip + limit;
        result.hasPrev = skip > 0;
        result.perPage = perPage;
        result.page = page;
        result.pageCount = Math.ceil(count / perPage);
        sortCursor(cursor, req);
        return cursor.toArray();
    }).then((docs) => {
        result.docs = docs.map((doc) => {
            console.info(doc.states);
            const fallbackState = Object.keys(doc.states)[0];
            const currentState = doc.states[req.state] || doc.states[fallbackState];
            return {
                id: doc._id,
                state: doc.states[req.state] ? req.state : fallbackState,
                states: doc.states,
                createdAt: currentState.createdAt,
                createdBy: currentState.createdBy,
                data: currentState.data || {},
            };
        });
        return embedDocs.many(req, result.docs);
    }).then(() => res.json(result)).catch((err) => {
        console.error(err);
        res.json({});
    });
};


module.exports.postDoc = function (req, res) {
    console.info('post doc state', req.state);
    builder.create({
        user: req.user,
        body: req.body,
        resource: req.resource,
        state: req.state
    }).then((doc) => {
        req.resource.collection.insert(doc, (err, result) => {
            let output = Object.assign({
                state: req.state,
                id: result.ops[0]._id
            }, result.ops[0].states[req.state]);

            helpers.json(res, output);
            sendWebhook(req, output);
        });
    }).catch(helpers.validationError(res));
};

module.exports.putDocState = function (req, res) {

    const doSetState = function () {
        builder.setState({
            doc: req.doc,
            from: req.body.from,
            to: req.body.to,
            resource: req.resource,
            user: req.user
        }).then((ops) => {
            req.resource.collection.updateOne(req.filter, ops, onUpdate(req, res));
        }).catch(helpers.validationError(res));
    };

    const stateTo = req.resource.states[req.body.to];
    const stateFrom = req.resource.states[req.body.from];

    if (typeof stateTo === 'undefined') {
        helpers.error(res, {message: 'Undefined state', state: req.body.to});
    }

    if (typeof stateFrom === 'undefined') {
        helpers.error(res, {message: 'Undefined state', state: req.body.from});
    }

    if (!stateTo.validate) {
        return doSetState();
    }

    req.resource.collection.findOne(req.filter, (err, doc) => {
        req.doc = doc.states[req.body.from].data;
        doSetState();
    });
};

// modify a doc
module.exports.putDoc = function (req, res) {
    builder.update({
        body: req.body,
        resource: req.resource,
        state: req.state,
        user: req.user
    }).then((ops) => {
        req.resource.collection.updateOne(req.filter, ops, onUpdate(req, res));
    }).catch((err) => {
        return helpers.error(res, err);
    });
};


module.exports.getDoc = function (req, res) {
    const fields = builder.select({
        resource: req.resource,
        user: req.user,
        query: req.query,
        state: req.state
    });

    req.resource.collection.findOne(req.filter, fields, (err, doc) => {
        if (doc === null) {
            return helpers.notFound(res)
        }

        const currentState = doc.states[req.state] || {};
        const returnValue = {
            id: doc._id,
            state: req.state,
            states: doc.states,
            createdAt: currentState.createdAt,
            createdBy: currentState.createdBy,
            data: currentState.data || {},
        };

        embedDocs.one(req, returnValue.data)
            .then(() => helpers.json(res, returnValue));
    });
};

module.exports.delDoc = function (req, res) {
    req.resource.collection.findOneAndDelete(req.filter, (err) => {
        return helpers.error(res, err) || res.send(200);
    });
};


module.exports.getResources = function (req, res) {
    let result = {resources: []};
    forIn(req.schema.resources, (resource, id) => {
        result.resources.push({
            id: id,
            label: resource.label,
            type: resource.type,
            states: resource.states,
            defaultState: resource.defaultState,
            permissions: resource.permissions,
            fields: resource.fields
        });
    });

    result.types = req.schema.types;

    helpers.json(res, result);
};
