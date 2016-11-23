'use strict';


const express = require('express');
const session = require('express-session');
const app = express();
const cors = require('cors');
const passport = require('passport');
const SessionStore = require('connect-mongodb-session')(session);

const bodyParser = require('body-parser');
const { MongoClient} = require('mongodb');

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

let auth;


/**
 * @param server
 * @param {Schema} schema
 * @param db
 */
const setMiddlewares = (server, schema, db) => {

    server.use(cors());
    server.use(session({
        secret: 'keyboard cat', // config
        resave: false,
        saveUninitialized: false,
        store: new SessionStore({
            uri: db.URI,
            collection: '__sessions__'
        })
    }));
    server.use(bodyParser.json());
    server.use(bodyParser.urlencoded({extended: false}));
    server.use(decorateRequest(schema, db));
    server.use(authUser(schema, db));
    server.param('resource', parseParams(schema, db));

    /// maybe move to auth
    //app.use(passport.initialize());
    //app.use(passport.session());

};

/**
 * @param server
 */
const setRoutes = (server) => {
    //// ADMIN
    server.get('/resources', adminOnly, admin.getResources);
    server.get('/resources/:resource', adminOnly, admin.getResource);
    server.get('/users', adminOnly, admin.listUsers);
    server.post('/users', adminOnly, admin.createUser);
    server.post('/invitation', adminOnly, admin.createInvitation);

    //// AUTH
    server.get('/auth/providers', auth.getProviders);
    server.get('/auth/local', auth.local);
    server.post('/auth/local', auth.local);
    server.get('/auth/:strategy', auth.initAuth);
    server.get('/auth/:strategy/callback', auth.callback);

    //// SEARCH
    server.get('/search/:sid', search.getSearch);
    server.post('/search/', search.postSearch);
    server.post('/search/:sid', search.putSearch);
    server.delete('/search/:sid', search.delSearch);


    //// DOCS
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
    server.delete('/docs/:resource/:id', docs.delDoc);
};


/**
 * Setup middlewares and routes
 *
 * @param schema
 * @param config
 * @returns {Promise}
 */
function init(schema, config) {
    return new Promise((resolve)=> {
        const mongoURI = `${config.mongoURI}/${schema.name}`;
        MongoClient.connect(mongoURI, (err, db)=> {
            db.URI = mongoURI;
            auth = require('./handlers/auth')(db, config.authProviders);
            setMiddlewares(app, schema, db);
            setRoutes(app);
            return parseSchema(schema, db).then(resolve);
        });
    });
}

module.exports = app;
module.exports.init = init;