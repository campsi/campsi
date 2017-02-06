'use strict';


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

const services = {
    auth: require('./services/auth'),
    docs: require('./services/docs'),
    users: require('./services/users'),
    assets: require('./services/assets')
};

/**
 * @property {Db} db
 */
class CampsiServer extends EventEmitter {

    constructor(config) {
        super();
        this.app = express();
        this.config = config;
        this.services = {};

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
            async.eachOf(this.config.services, (serviceConfig, path, cb) => {
                const Service = services[serviceConfig.kind];
                this.services[path] = new Service(serviceConfig, this.db);
                this.services[path].initialize().then(() => {
                    this.app.use('/' + path, this.services[path].router);
                    cb();
                }).catch((err)=> {
                    console.error(err);
                });
            }, resolve);
        });
    }
}

module.exports = CampsiServer;