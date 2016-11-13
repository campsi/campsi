'use strict';

const async = require('async');
const Campsi = require('campsi-core');
require('campsi-base-components');

/**
 *
 * @param {Schema} schema
 * @param db
 * @returns {Promise}
 */
module.exports = function (schema, db) {
    return new Promise((resolve, reject)=> {
        async.eachOf(schema.resources, function (resource, name, cb) {
            Object.assign(resource, schema.types[resource.type]);
            Campsi.create('form', {
                options: {fields: resource.fields},
                context: new Campsi.context()
            }, function (component) {
                resource.model = component;
                db.collection(name, function (err, collection) {
                    if (err) {
                        console.error(err);
                    }
                    resource.collection = collection;
                    cb();
                });
            });
        }, resolve);
    });
};
