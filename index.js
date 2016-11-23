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
 @property {Webhook} webhooks
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


/**
 * @name Webhook
 * @type {Object}
 * @property {String} on
 * @property {String} method
 * @property {String} uri
 * @property {Boolean} payload
 * @property {Array<String>} states
 * @property {Object<String, String>} headers
 */



const config = require('config');
const path = require('path');
const commandLineArgs = require('command-line-args');

const args = commandLineArgs([
    {name: 'verbose', alias: 'v', type: Boolean},
    {name: 'schema', type: String, defaultOption: true},
    {name: 'port', alias: 'P', type: Number}
]);
const schemaFile = args.schema || config.schema;
const schema = require(path.resolve(__dirname, schemaFile));

const app = require('./app/server');
app.init(schema, config)
    .then(()=>{
        app.listen(args.port || config.port);
        console.info('listening to', args.port || config.port);
    });