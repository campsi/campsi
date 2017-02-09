'use strict';

const CampsiService = require('./service');
const {EventEmitter} = require('events');
const express = require('express');
const session = require('express-session');
const async = require('async');
const forIn = require('for-in');

// middlewares
const cors = require('cors');
const authUser = require('./middlewares/authUser');
const bodyParser = require('body-parser');

const SessionStore = require('connect-mongodb-session')(session);
const {MongoClient} = require('mongodb');

/**
 * @property {Db} db
 */
class CampsiServer extends EventEmitter {

    constructor(config) {
        super();
        this.app = express();
        this.config = config;
        this.services = {};
    }

    mount(path, service) {
        if(!/^[a-z]*$/.test(path)) {
            throw path + " is malformed";
        }
        if(!(service.constructor.prototype instanceof CampsiService)) {
            throw path + " is not a CampsiService";
        }
        if(this.services[path]) {
            throw path + " already exists";
        }
        this.services[path] = service;
    }

    start() {
        this.dbConnect()
            .then(() => this.setupApp())
            .then(() => this.loadServices())
            .then(() => this.describe())
            .then(() => this.emit('ready'))
            .catch((err) => {
                console.error(err);
            })
    }

    describe() {
        this.app.get('/', (req, res) => {
            let result = {
                title: this.config.title,
                services: {}
            };
            forIn(this.services, (service, path) => {
                result.services[path] = service.describe();
            });
            res.json(result)
        });
    }

    dbConnect() {
        const server = this;
        const URI = this.config.mongoURI;
        return new Promise((resolve) => {
            MongoClient.connect(URI).then((db) => {
                server.db = db;
                resolve();
            });
        });
    }

    setupApp() {
        this.app.use(cors());
        this.app.use(bodyParser.json());
        this.app.use(bodyParser.urlencoded({extended: false}));
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
        this.app.use((req, res, next) => {
            req.db = this.db;
            req.config = this.config;
            next();
        });
    }

    loadServices() {
        return new Promise((resolve) => {
            async.eachOf(this.services, (service, path, cb) => {
                service.server = this;
                service.db = this.db;
                service.initialize().then(() => {
                    this.app.use('/' + path, service.router);
                    cb();
                }).catch((err)=> {
                    console.error(err);
                });
            }, resolve);
        });
    }
}

module.exports = CampsiServer;