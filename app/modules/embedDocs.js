const async = require('async');
const ObjectId = require('mongodb').ObjectId;
const findRefs = require('campsi-find-references');
const builder = require('./queryBuilder');

module.exports = function embedDocs(req, doc) {
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

