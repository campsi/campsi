'use strict';

const builder = require('../modules/queryBuilder');
const helpers = require('../modules/responseHelpers');
const embedDocs = require('../modules/embedDocs');
const paginateCursor = require('../modules/paginateCursor');
const sortCursor = require('../modules/sortCursor');
const sendWebhook = require('../modules/sendWebhook');

const onUpdate = (req, res)=> (err, result) => {
    if (err){
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

module.exports.getDocs = function getDocs(req, res) {

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
    cursor.count((err, count)=> {
        result.count = count;
        result.label = req.resource.label;

        paginateCursor(cursor, req.query);
        sortCursor(cursor, req);

        cursor.toArray((err, docs) => {
            result.docs = docs.map((doc)=> Object.assign({id: doc._id}, doc.states[req.state]));
            embedDocs.many(req, result.docs).then(()=> {
                helpers.json(res, result)
            });
        });
    });
};


module.exports.postDoc = function postDoc(req, res) {
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
};

module.exports.putDocState = function putDocState(req, res) {

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
};

// modify a doc
module.exports.putDoc = function putDoc(req, res) {
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
};


module.exports.getDoc = function getDoc(req, res) {
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
};

module.exports.delDoc = function delDoc(req, res) {
    req.resource.collection.findOneAndDelete(req.filter, (err) => {
        return helpers.error(res, err) || res.send(200);
    });
};
