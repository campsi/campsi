'use strict';

const Campsi = require('campsi-core');
const async = require('async');
require('campsi-base-components');

const parseParams = require('./middlewares/parseParams');
const authUser = require('./middlewares/authUser');
const handlers = require('./handlers');


/**
 @name Resource
 @type {Object}
 @property {String} defaultState
 @property {Object.<String, State>} states
 @property {String} label
 @property {String} type
 @property {Object<String,Relationship>} rels
 @property {Object} permissions
 @property {Object} collection
 */

/**
 * @name Schema
 * @type {object}
 * @property {Array<Resource>} resources
 * @property {Array<Object>} types
 * @property {Array<User>} users
 */
/**
 * @name Relationship
 * @type {object}
 * @property {string} resource
 * @property {Array<string>} fields
 * @property {string} path
 * @property {boolean} embed
 */

/**
 * @name State
 * @type {object}
 * @property {boolean} validate
 * @property {string} name
 */

/**
 *
 * @name User
 * @type {Object}
 * @property {String} role
 */

/**
 * @param {Server} server
 * */
const setRoutes = function (server) {
    // GET
    server.get('/', handlers.getResources);
    server.get('/:resource/schema', handlers.getAdminDocs);
    server.get('/:resource', handlers.getDocs);
    server.get('/:resource/:id/:state', handlers.getDoc);
    server.get('/:resource/:id', handlers.getDoc);

    // POST
    server.post('/:resource/:state', handlers.postDoc);
    server.post('/:resource', handlers.postDoc);

    // PUT
    server.put('/:resource/:id/state', handlers.putDocState);
    server.put('/:resource/:id/:state', handlers.putDoc);
    server.put('/:resource/:id', handlers.putDoc);

    // DEL
    server.del('/:resource/:id', handlers.delDoc);

    ///*
    // TODO Views
    // */
    //server.get('/:resource/:id/changes', (req, res)=> {
    //    //returns changes since
    //});
    //
    //// accessing saved search a.k.a. a view
    //server.get('/search/:resource/:id', (req, res, next) => {
    //    return res.json(200, {entries: []}, {});
    //});
    //// creating a view
    //server.post('/search/:resource', (req, res, next) => {
    //    return res.json(200, {entries: []}, {});
    //});
};

const parseSchema = function (schema, db) {
    return new Promise((resolve, reject)=> {
        async.eachOf(schema.resources, function (resource, name, cb) {
            Object.assign(resource, schema.types[resource.type]);
            Campsi.create('form', {
                options: {fields: resource.fields},
                context: new Campsi.context()
            }, function (component) {
                resource.model = component;
                db.collection(name, function(err,collection){
                    if(err){
                        console.error(err);
                    }
                    resource.collection = collection;
                    cb();
                });
            });
        }, resolve);
    });
};

const setMiddlewares = function (server, schema, db) {
    server.use(parseParams(schema, db));
    server.use(authUser(schema, db));
};


module.exports = function (schema, server, db) {
    setMiddlewares(server, schema, db);
    setRoutes(server);
    return parseSchema(schema, db);

};