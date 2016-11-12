'use strict';


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
 * @property {Object<string,Role>} roles
 */


/**
 * @name Role
 * @type {object}
 * @property {String} label
 * @property {Boolean} auth
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

const restify = require('restify');
const parseJSON = require('./app/modules/parseJSON');
const config = require('config');
const { MongoClient } = require('mongodb');
const assert = require('assert');
const bunyan = require('bunyan');
const path = require('path');
const passport = require('passport');
const commandLineArgs = require('command-line-args');

const args = commandLineArgs( [
    {name: 'verbose', alias: 'v', type: Boolean},
    {name: 'schema', type: String, defaultOption: true},
    {name: 'port', alias: 'P', type: Number}
]);
const schemaFile = args.schema || config.schema;
const server = restify.createServer({});
//noinspection JSCheckFunctionSignatures
const logger = bunyan.createLogger({name: 'campsi api', hostname: 'CLI'});

server.use([
    restify.requestLogger({log: logger}),
    restify.authorizationParser(),
    restify.fullResponse(),
    restify.CORS(),
    restify.queryParser({mapParams: false}),
    restify.jsonBodyParser({mapParams: false}),
    restify.pre.sanitizePath()
]);

server.on('uncaughtException', function (req, res, route, err) {
    console.error(route);
    console.error(err.message);
    console.error(err.stack);
    logger.error(err);
    res.send(500);
    process.exit(1);
});

logger.info('application init');

parseJSON(path.resolve(__dirname, schemaFile)).then((schema)=> {
    const mongoURI = `${config.mongoURI}/${schema.name}`;
    const port = args.port || config.port;

    MongoClient.connect(mongoURI, (err, db)=> {
        assert.equal(null, err);
        logger.info('mongodb connection OK', {uri: mongoURI});
        require('./app/routes')(schema, server, db).then(()=> {
            server.listen(port);
            logger.info('server listening on port', port);
        });
    });
}, (err)=> {
    err.schemaFile = schemaFile;
    logger.error(err);
    process.exit(1);
});