'use strict';


const {EventEmitter} = require('events');
const express = require('express');
const session = require('express-session');
const async = require('async');

// middlewares
const cors = require('cors');
const authUser = require('./middlewares/authUser');
const bodyParser = require('body-parser');

const SessionStore = require('connect-mongodb-session')(session);
const { MongoClient} = require('mongodb');
const Campsi = require('campsi-core');
require('campsi-base-components');


const handlers = {
    docs: require('./handlers/docs'),
    admin: require('./handlers/admin'),
    search: require('./handlers/search'),
    assets: require('./handlers/assets'),
    auth: require('./handlers/auth')
};

/**
 * @property {Db} db
 */
class CampsiServer extends EventEmitter {
    /**
     *
     * @param {Schema} schema
     * @param {CampsiServerConfig} config
     */
    constructor(schema, config) {
        super();
        this.app = express();
        this.schema = schema;
        this.config = config;
        this.mongoURI = `${config.mongoURI}/${schema.name}`;
        this.dbConnect()
            .then(() => this.setupApp())
            .then(() => this.parseSchema())
            .then(() => this.loadHandlers())
            .then(()=> this.emit('ready'))
            .catch((err)=> {
                console.error(err);
            })
    }

    dbConnect() {
        console.info('db connect');
        return new Promise((resolve)=> {
            MongoClient.connect(this.mongoURI).then((db)=> {
                console.info(' -> OK');
                db.URI = this.mongoURI;
                this.db = db;
                resolve();
            });
        });
    }

    setupApp() {
        console.info('setup app');
        console.info(' -> CORS');
        this.app.use(cors());
        console.info(' -> bodyparser');
        this.app.use(bodyParser.json());
        this.app.use(bodyParser.urlencoded({extended: false}));
        console.info(' -> auth');
        this.app.use(session({
            secret: 'keyboard cat', // config
            resave: false,
            saveUninitialized: false,
            store: new SessionStore({
                uri: this.db.URI,
                collection: '__sessions__'
            })
        }));
        this.app.use(authUser(this));
        this.app.use((req, res, next)=> {
            req.db = this.db;
            req.schema = this.schema;
            req.config = this.config;
            next();
        });
    }

    parseSchema() {
        console.info('parse schema');
        const self = this;
        return new Promise((resolve)=> {
            async.eachOf(self.schema.resources, function (resource, name, cb) {

                Object.assign(resource, self.schema.types[resource.type]);
                Campsi.create('form', {
                    options: {fields: resource.fields},
                    context: new Campsi.context()
                }, function (component) {
                    console.info(' -> resource', name);
                    resource.model = component;
                    resource.collection = self.db.collection(name);
                    cb();
                });
            }, resolve);
        })
    }

    loadHandlers() {
        console.info('load handlers');
        return new Promise((resolve)=> {
            async.eachOf(this.config.handlers, (handler, name, cb)=> {
                console.info(' -> handler', name, typeof handlers[name]);
                const plugin = handlers[name];
                if(typeof plugin !== 'function'){
                    console.error('   -> not a function');
                    return cb();
                }
                plugin(this, handler.options, (router)=> {
                    this.app.use(handler.path, router);
                    cb();
                });
            }, resolve);
        });
    }
}

module.exports = CampsiServer;