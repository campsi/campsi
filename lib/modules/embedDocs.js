const async = require('async');
const ObjectId = require('mongodb').ObjectId;
const findRefs = require('campsi-find-references');
const builder = require('./queryBuilder');

function fetchSubdoc(resource, reference, user, hash) {
    const _id = reference.get();
    return new Promise((resolve)=> {
        if (typeof hash[_id] !== 'undefined') {
            reference.set(hash[_id]);
            return resolve();
        }

        resource.collection.findOne(
            {_id: new ObjectId(_id)},
            builder.select({resource: resource, user: user}),
            (err, subDoc)=> {
                hash[_id] = subDoc.states[resource.defaultState].data;
                reference.set(hash[_id]);
                return resolve();
            }
        );
    });
}

/**
 *
 * @param {Object} req
 * @param {Resource} req.resource
 * @param {Schema} req.schema
 * @param {User} req.user
 * @param {Object} doc
 * @param {Object} [hash]
 * @returns {Promise}
 */
function embedDocs(req, doc, hash) {
    hash = hash || {};
    return new Promise((resolve, reject)=> {
        let error;
        async.eachOf(req.resource.rels || {}, (relationship, name, cb)=> {

            const embedRel = (relationship.embed || (req.query.embed && req.query.embed.indexOf(name) > -1));
            if (!embedRel) {
                return async.setImmediate(cb);
            }

            const references = findRefs(doc, relationship.path.split('.'));
            async.each(references, (reference, refCb)=> {
                fetchSubdoc(
                    req.schema.resources[relationship.resource],
                    reference,
                    req.user,
                    hash
                ).then(refCb);
            }, cb);

        }, ()=> (error) ? reject() : resolve());
    });
}
module.exports.one = embedDocs;
module.exports.many = function (req, docs) {
    let hash = {};
    return new Promise((resolve)=> {
        async.forEach(docs, (doc, cb)=> {
            embedDocs(req, doc.data, hash).then(cb);
        }, resolve);
    });
};