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
 * @property {String} name
 * @property {String} title
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
 * @property {String|Array} role
 * @property {Boolean} isAdmin
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
/**
 * @name ExpressRequest
 * @type {Object}
 * @property {Object} headers
 * @property {Object} query
 * @property {Object} session
 * @property {String} headers.referer
 * @property {String} headers.authorization
 * @property {AssetMetadata} asset
 */

/**
 *
 * @name CampsiServerConfig
 * @type {Object}
 * @property {Number} port
 * @property {String} schema Path of the schema file
 * @property {String} mongoURI
 * @property {String} host
 * @property {Object<String,Object>} handlers
 * @property {CampsiServerConfig~AssetsOptions} handlers.assets.options
 * @property {CampsiServerConfig~AuthOptions} handlers.auth.options
 */

/**
 *
 * @name CampsiServerConfig~AssetsOptions
 * @type {Object}
 * @property {Object} storage
 * @property {Function} storage.getStorage
 * @property {CampsiServerConfig~AssetsOptions~getAssetURL} storage.getAssetURL
 * @property {CampsiServerConfig~AssetsOptions~deleteAsset} storage.deleteAsset
 *
 */

/**
 * @name CampsiServerConfig~AssetsOptions~getAssetURL
 * @type {Function}
 * @param {AssetMetadata} metadata
 * @return {String}
 */
/**
 * @name CampsiServerConfig~AssetsOptions~deleteAsset
 * @type {Function}
 * @param {AssetMetadata} metadata
 * @return {Promise}
 */

/**
 * @name AssetMetadata
 * @type {Object}
 * @property {ObjectID} _id
 * @property {String} path
 * @property {String} filename
 * @property {String} originalname
 * @property {String} encoding
 * @property {String} mimetype
 * @property {String} relativePath
 * @property {String} absolutePath
 * @property {String} url
 * @property {Object|undefined} dimensions
 * @property {Number} dimensions.height
 * @property {Number} dimensions.width
 * @property {String} dimensions.type
 * @property {Number} size
 * @property {Object|undefined} metadata
 * @property {Object|undefined} metadata.image
 * @property {Object|undefined} metadata.exif
 */

/**
 * @name CampsiServerConfig~AuthOptions
 * @property {Object<String,AuthProviderConfig>} providers
 */
/**
 * @name AuthProviderConfig
 * @type {Object}
 * @property {Strategy} Strategy
 * @property {String} title
 * @property {Number} order
 * @property {Object} options
 * @property {Object} colors
 * @property {Array} scope
 * @property {Function} callback
 */

const CampsiServer = require('./lib/server');

module.exports = CampsiServer;
