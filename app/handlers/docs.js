'use strict';

const builder = require('../modules/queryBuilder');
const helpers = require('../modules/responseHelpers');
const embedDocs = require('../modules/embedDocs');
const paginateCursor = require('../modules/paginateCursor');
const sortCursor = require('../modules/sortCursor');
const sendWebhook = require('../modules/sendWebhook');
const router = require('express').Router();

const onUpdate = (req, res)=> (err, result) => {
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

function getDocs(req, res) {

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
    cursor.count().then((count) => {
        result.count = count;
        result.label = req.resource.label;
        let {skip, limit } = paginateCursor(cursor, req.query, {perPage: 5});
        result.hasNext = result.count > skip + limit;
        result.hasPrev = skip > 0;
        sortCursor(cursor, req);
        return cursor.toArray();
    }).then((docs) => {
        result.docs = docs.map((doc)=> Object.assign({id: doc._id}, doc.states[req.state]));
        return embedDocs.many(req, result.docs);
    }).then(()=> res.json(result)).catch((err)=> {
        console.error(err);
        res.json({});
    });
}


function postDoc(req, res) {
    builder.create({
        user: req.user,
        body: req.body,
        resource: req.resource,
        state: req.state
    }).then((doc)=> {
        req.resource.collection.insert(doc, (err, result)=> {
            let output = Object.assign({
                state: req.state,
                id: result.ops[0]._id
            }, result.ops[0].states[req.state]);

            helpers.json(res, output);
            sendWebhook(req, output);
        });
    }).catch(helpers.validationError(res));
}

function putDocState(req, res) {

    const doSetState = function () {
        builder.setState({
            doc: req.doc,
            from: req.body.from,
            to: req.body.to,
            resource: req.resource,
            user: req.user
        }).then((ops)=> {
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
}

// modify a doc
function putDoc(req, res) {
    builder.update({
        body: req.body,
        resource: req.resource,
        state: req.state,
        user: req.user
    }).then((ops)=> {
        req.resource.collection.updateOne(req.filter, ops, onUpdate(req, res));
    }).catch((err)=> {
        return helpers.error(res, err);
    });
}


function getDoc(req, res) {
    const fields = builder.select({
        resource: req.resource,
        user: req.user,
        query: req.query,
        state: req.state
    });

    req.resource.collection.findOne(req.filter, fields, (err, doc) => {
        if (doc === null || typeof doc.states[req.state] === 'undefined') {
            return helpers.notFound(res)
        }

        embedDocs.one(req, doc.states[req.state].data)
            .then(()=> helpers.json(res, doc.states[req.state]));
    });
}

function delDoc(req, res) {
    req.resource.collection.findOneAndDelete(req.filter, (err) => {
        return helpers.error(res, err) || res.send(200);
    });
}


/**
 * @param {CampsiServer} server
 * @param {Object} options
 * @param {Function} cb
 */
module.exports = function (server, options, cb) {
    router.param('resource', (req, res, next)=> {
        if (req.params.resource) {
            req.resource = server.schema.resources[req.params.resource];

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
        if (req.params.role && typeof server.schema.roles[req.params.role] === 'undefined') {
            return helpers.notFound(res);
        }
        next();
    });
    router.get('/:resource', getDocs);
    router.get('/:resource/:id/:state', getDoc);
    router.get('/:resource/:id', getDoc);
    router.post('/:resource/:state', postDoc);
    router.post('/:resource', postDoc);
    router.put('/:resource/:id/state', putDocState);
    router.put('/:resource/:id/:state', putDoc);
    router.put('/:resource/:id', putDoc);
    router.delete('/:resource/:id', delDoc);

    cb(router);
};