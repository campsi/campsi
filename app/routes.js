'use strict';

// middlewares
const decorateRequest = require('./middlewares/decorateRequest');
const parseParams = require('./middlewares/parseParams');
const authUser = require('./middlewares/authUser');
const adminOnly = require('./middlewares/adminOnly');

// app modules
const parseSchema = require('./modules/parseSchema');

// route handlers
const docs = require('./handlers/docs');
const admin = require('./handlers/admin');
const search = require('./handlers/search');

/**
 *
 * @param server
 * @param {Schema} schema
 * @param db
 */
const setMiddlewares = function (server, schema, db) {
    server.use(decorateRequest(schema, db));
    server.use(parseParams(schema, db));
    server.use(authUser(schema, db));
};

/**
 * @param server
 * */
const setRoutes = function (server) {
    // ADMIN
    server.get('/admin/resources', adminOnly, admin.getResources);
    server.get('/admin/resources/:resource', adminOnly, admin.getResource);
    server.get('/admin/users', adminOnly, admin.listUsers);
    server.post('/admin/users', adminOnly, admin.createUser);
    server.post('/admin/roles/:role/token', adminOnly, admin.createInvitationToken);

    // SEARCH
    server.get('/search/:sid', search.getSearch);
    server.post('/search/', search.postSearch);

    // DOCS /////
    // GET
    server.get('/docs/:resource', docs.getDocs);
    server.get('/docs/:resource/:id/:state', docs.getDoc);
    server.get('/docs/:resource/:id', docs.getDoc);

    // POST
    server.post('/docs/:resource/:state', docs.postDoc);
    server.post('/docs/:resource', docs.postDoc);

    // PUT
    server.put('/docs/:resource/:id/state', docs.putDocState);
    server.put('/docs/:resource/:id/:state', docs.putDoc);
    server.put('/docs/:resource/:id', docs.putDoc);

    // DEL
    server.del('/docs/:resource/:id', docs.delDoc);
};


module.exports = function (schema, server, db) {
    setMiddlewares(server, schema, db);
    setRoutes(server);
    return parseSchema(schema, db);
};