'use strict';

const debug = require('debug')('campsi');
const forIn = require('for-in');

function join(...properties) {
    return properties.join('.');
}

/**
 *
 * @param {object} options
 * @param {string} [propertyName]
 * @returns {State}
 */
function getStateFromOptions(options, propertyName) {
    propertyName = propertyName || 'state';
    const stateName = options[propertyName] || options.resource.defaultState;
    let stateObj = options.resource.states[stateName] || {validate: false};
    stateObj.name = stateName;
    return stateObj;
}

/**
 *
 * @param {object} model
 * @param {object} doc
 * @param {boolean} doValidate
 * @returns {Promise}
 */
function validate(model, doc, doValidate) {
    return new Promise((resolve, reject) => {
        if (doValidate !== true) {
            return resolve();
        }
        model.setValue(doc, function () {
            if (model.errors.length > 0) {
                debug('model have %d errors', model.errors.length);
                return reject(model.errors);
            }
            resolve();
        });
    });
}

module.exports.find = function find(options) {
    let state = getStateFromOptions(options);
    let filter = {};

    if (options.query) {
        forIn(options.query, (val, prop) => {
            if (prop.indexOf('data.') === 0) {
                filter[join('states', state.name, prop)] = val;
            }
        });
    }
    return filter;
};

// todo move and extract to use in the controller
function getStatesForUser(options) {
    const states = Object.keys(options.resource.states);
    const roles = (options.user && options.user.role) ? options.user.role : ['public'];
    let allowed = [];

    roles.forEach(function (role) {
        let permission = options.resource.permissions[role];
        states.forEach(function (state) {
            if (permission && permission[state] && (
                !options.method
                || permission[state] === '*'
                || permission[state].indexOf(options.method)
                )
            ) {
                allowed.push(state);
            }
        });
    });

    return allowed;
}

module.exports.select = function select(options) {
    // let state = getStateFromOptions(options);
    let fields = {
        _id: 1,
    };
    let modelFields = options.resource.fields.map((field) => (!field.hide) ? field.name : null);
    let states = getStatesForUser(options);

    states.forEach(function (state) {
        fields[join('states', state, 'createdAt')] = 1;
        fields[join('states', state, 'createdBy')] = 1;
        fields[join('states', state, 'modifiedAt')] = 1;
        fields[join('states', state, 'modifiedBy')] = 1;
        modelFields.forEach(function (field) {
            fields[join('states', state, 'data', field)] = 1;
        });
    });
    return fields;
};

/**
 *
 * @param {Object} options.body
 * @param {Resource} options.resource
 * @param {String} [options.state]
 * @param {User} [options.user]
 * @returns {Promise}
 */
module.exports.create = function createDoc(options) {
    const state = getStateFromOptions(options);

    return new Promise((resolve, reject) => {

        validate(options.resource.model, options.body, state.validate)
            .catch(reject)
            .then(() => {
                let doc = {states: {}};
                doc.states[state.name] = {
                    createdAt: new Date(),
                    createdBy: options.user ? options.user._id : null,
                    data: options.body
                };
                resolve(doc);
            });

    });
};

/**
 *
 * @param {object} options.body
 * @param {Resource} options.resource
 * @param {string} [options.state]
 * @param {object} [options.user]
 *
 * @returns {Promise}
 */
module.exports.update = function updateDoc(options) {
    const state = getStateFromOptions(options);
    return new Promise((resolve, reject) => {
        validate(options.resource.model, options.body, state.validate)
            .catch(reject)
            .then(() => {
                let ops = {$set: {}};
                ops.$set[join('states', state.name, 'modifiedAt')] = new Date();
                ops.$set[join('states', state.name, 'modifiedBy')] = options.user ? options.user.id : null;
                ops.$set[join('states', state.name, 'data')] = options.body;
                return resolve(ops);
            });
    });
};

module.exports.delete = function deleteDoc() {
};

module.exports.getStates = function getDocStates(options) {
    let fields = {
        _id: 1,
    };
    let states = getStatesForUser(options);

    states.forEach(function (state) {
        fields[join('states', state, 'createdAt')] = 1;
        fields[join('states', state, 'createdBy')] = 1;
        fields[join('states', state, 'modifiedAt')] = 1;
        fields[join('states', state, 'modifiedBy')] = 1;
    });
    return fields;
};

/**
 *
 * @param {string} options.from
 * @param {string} options.to
 * @param {Object} options.user
 * @param {Resource} options.resource
 * @param {Object} [options.doc]
 * @returns {Promise}
 */
module.exports.setState = function setDocState(options) {

    const stateTo = getStateFromOptions(options, 'to');

    return new Promise((resolve, reject) => {
        validate(options.resource.model, options.doc, stateTo.validate)
            .catch(reject)
            .then(() => {
                let ops = {$rename: {}, $set: {}};
                ops.$rename[join('states', options.from)] = join('states', options.to);
                ops.$set.modifiedAt = new Date();
                ops.$set.modifiedBy = options.user ? options.user.id : null;
                return resolve(ops);
            });
    });
};

module.exports.filterUserByEmailOrProviderId = (provider, profile) => {
    let query = {$or: []};
    let identityIdFilter = {};
    identityIdFilter['identities.' + provider.name + '.id'] = profile.identity.id;
    query.$or.push(identityIdFilter);

    if (profile.email) {
        query.$or.push({email: profile.email});
    }

    return query;
};