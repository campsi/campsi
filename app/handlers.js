'use strict';

const builder = require('./builder');
const helpers = require('./helpers');
const async = require('async');
const ObjectId = require('mongodb').ObjectId;
const findRefs = require('campsi-find-references');

const onValidationError = function (res) {
    return function (errors) {
        helpers.error(res, {
            message: 'Validation Error',
            fields: errors
        });
    }
};

const embedRelatedDocuments = function (req, doc) {
    return new Promise((resolve, reject)=> {
        let error;
        let cache = {};
        let _id;

        async.eachOf(req.resource.rels || {}, (relationship, name, cb)=> {
            if (relationship.embed || (req.query.embed && req.query.embed.indexOf(name) > -1)) {
                let references = findRefs(doc, relationship.path.split('.'));
                async.each(references, (reference, refCb)=> {
                    let resource = req.schema.resources[relationship.resource];
                    _id = reference.get();

                    if (typeof cache[_id] !== 'undefined') {
                        reference.set(cache[_id]);
                        return refCb();
                    }

                    resource.collection.findOne(
                        {_id: new ObjectId(_id)},
                        builder.select({resource: resource, user: req.user}),
                        (err, subDoc)=> {
                            cache[_id] = subDoc.states[resource.defaultState].data;
                            reference.set(cache[_id]);
                            refCb();
                        }
                    );
                }, cb);
            } else {
                cb();
            }
        }, ()=> {
            return (error) ? reject() : resolve();
        })
    });
};


module.exports.getResources = function getResources(req, res) {
    helpers.json(res, Object.keys(req.schema.resources));
};

/**
 *
 * @param req
 * @param {Resource} req.resource
 * @param res
 */
module.exports.getAdminDocs = function getAdminDocs(req, res) {
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

module.exports.getDocs = function getDocs(req, res) {

    const query = builder.find({
        resource: req.resource,
        user: req.user,
        query: req.query
    });

    const fields = builder.select({
        resource: req.resource,
        user: req.user,
        query: req.query
    });

    const cursor = req.resource.collection.find(query, fields);

    let result = {};
    cursor.count((err, count)=> {
        result.count = count;
        result.label = req.resource.label;
        cursor.limit(100).toArray((err, docs) => {
            result.docs = docs.map((doc)=> doc.states[req.state]);
            async.each(result.docs, (doc, cb)=> {
                embedRelatedDocuments(req, doc.data).then(cb).catch(cb);
            }, ()=> {
                helpers.json(res, result);
            });
        });
    });
};


module.exports.postDoc = function postDoc(req, res) {
    builder.create({
        user: req.user,
        body: req.body,
        resource: req.resource,
        state: req.params.state
    }).then((doc)=> {
        req.resource.collection.insert(doc, (err, result)=> {
            helpers.json(res, result);
        });
    }).catch(onValidationError(res));
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
            req.resource.collection.updateOne(req.filter, ops, function (err) {
                return helpers.error(res, err) ? null : res.send(200);
            });
        }).catch(onValidationError(res));
    };

    const stateTo = req.resource.states[req.body.to];
    const stateFrom = req.resource.states[req.body.from];

    if (typeof stateTo === 'undefined') {
        helpers.error(res, {message: 'Undefined state', state: req.body.to});
    }

    if (typeof stateFrom === 'undefined') {
        helpers.error(res, {message: 'Undefined state', state: req.body.from});
    }


    if (stateTo.validate) {
        req.resource.collection.findOne(req.filter, (err, doc) => {
            req.doc = doc.states[req.body.from].data;
            doSetState();
        });
    } else {
        doSetState();
    }
};

// modify a doc
module.exports.putDoc = function putDoc(req, res) {
    builder.update({
        body: req.body,
        resource: req.resource,
        state: req.params.state,
        user: req.user
    }).then((ops)=> {
        req.resource.collection.updateOne(req.filter, ops, function (err, result) {
            return helpers.json(res, result);
        });
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

        embedRelatedDocuments(req, doc.states[req.state].data)
            .then(()=> helpers.json(res, doc.states[req.state]));
    });
};

module.exports.delDoc = function delDoc(req, res) {
    req.resource.collection.findOneAndDelete(req.filter, (err) => {
        return helpers.error(res, err) || res.send(200);
    });
};
