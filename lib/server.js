const CampsiService = require('./service');
const debug = require('debug')('campsi');
const MQTTEmitter = require('mqtt-emitter');
const express = require('express');
const session = require('express-session');
const async = require('async');
const forIn = require('for-in');

// middlewares
const cors = require('cors');
const bodyParser = require('body-parser');

const SessionStore = require('connect-mongodb-session')(session);
const {MongoClient} = require('mongodb');

function ServiceException(path, service, message) {
    this.name = 'Service exception';
    this.message = message;
    this.path = path;
    this.service = service;
}

/**
 * @property {Db} db
 */
class CampsiServer extends MQTTEmitter {

    constructor(config) {
        super();
        this.app = express();
        this.config = config;
        this.services = new Map();
    }

    listen() {
        return this.app.listen(...arguments);
    }

    mount(path, service) {
        if(!/^[a-z]*$/.test(path)) {
            throw new ServiceException(path, service, 'Path is malformed');
        }
        if(!(service instanceof CampsiService)) {
            throw new ServiceException(path, service, 'Service is not a CampsiService');
        }
        if(this.services[path]) {
            throw new ServiceException(path, service, 'Path already exists');
        }
        this.services.set(path, service);
    }

    start() {
        return this.dbConnect()
            .then(() => this.setupApp())
            .then(() => this.loadServices())
            .then(() => this.describe())
            .then(() => this.emit('campsi/ready'));
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
            res.json(result);
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
        this.app.use((req, res, next) => {
            req.db = this.db;
            req.config = this.config;
            next();
        });
        this.app.use((req, res, next) => {
            res.header('X-powered-by', 'campsi');
            next();
        });
        for (let service of this.services.values()) {
            let middlewares = service.getMiddlewares();
            for(let middleware of middlewares) {
                this.app.use(middleware(this));
            }
        }
    }

    loadServices() {
        return new Promise((resolve) => {
            async.eachOf(this.services, (value, key, cb) => {
                let path = value[0];
                let service = value[1];
                service.server = this;
                service.db = this.db;
                service.path = path;
                service.initialize().then(() => {
                    this.app.use('/' + path, service.router);
                    cb();
                }).catch((err)=> {
                    debug('Error: %s', err);
                });
            }, resolve);
        });
    }
}

module.exports = CampsiServer;
