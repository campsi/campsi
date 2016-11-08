'use strict';
const restify = require('restify');
const parseJSON = require('./lib/utils/parseJSON');
const config = require('config');
const MongoClient = require('mongodb').MongoClient;
const assert = require('assert');
const bunyan = require('bunyan');
const path = require('path');

const commandLineArgs = require('command-line-args');
const argsDefinitions = [
    {name: 'verbose', alias: 'v', type: Boolean},
    {name: 'schema', type: String, defaultOption: true},
    {name: 'port', alias: 'P', type: Number}
];

const args = commandLineArgs(argsDefinitions);
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
    res.send(500);
    process.exit(1);
});

logger.info('application init');

parseJSON(path.resolve(__dirname, schemaFile)).then((schema)=> {
    const uri = `${config.mongoURI}/${schema.name}`;

    logger.info('mongodb connect', {uri : uri});
    MongoClient.connect(uri, (err, db)=> {
        assert.equal(null, err);
        logger.info('mongodb connection OK', {uri : uri});
        require('./app/routes')(schema, server, db).then(()=> {
            logger.info('server listening', args.port || config.port);
            server.listen(args.port || config.port);
        });
    });
}, (err)=> {
    err.schemaFile = schemaFile;
    logger.error(err);
    process.exit(1);
});