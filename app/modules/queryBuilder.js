'use strict';


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
    return new Promise((resolve, reject)=> {
        if (doValidate !== true) {
            return resolve();
        }
        model.setValue(doc, function () {
            console.dir(model.errors);
            if (model.errors.length > 0) {
                return reject(model.errors);
            }
            resolve();
        });
    });
}

module.exports.find = function find(options) {

    return {}
};

module.exports.select = function select(options) {
    let state = getStateFromOptions(options);
    let fields = {};
    fields[join('states', state.name)] = 1;
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
                    createdBy: options.user ? options.user.id : null,
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
    return new Promise((resolve, reject)=> {
        validate(options.resource.model, options.body, state.validate)
            .catch(reject)
            .then(()=> {
                let ops = {$set: {}};
                ops.$set[join('states', state.name)] = {
                    modifiedAt: new Date(),
                    modifiedBy: options.user ? options.user.id : null,
                    data: options.body
                };
                return resolve(ops);
            });
    });
};

module.exports.delete = function deleteDoc() {
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

    return new Promise((resolve, reject)=> {
        validate(options.resource.model, options.doc, stateTo.validate)
            .catch(reject)
            .then(()=> {
                let ops = {$rename: {}, $set: {}};
                ops.$rename[join('states', options.from)] = join('states', options.to);
                ops.$set.modifiedAt = new Date();
                ops.$set.modifiedBy = options.user ? options.user.id : null
                return resolve(ops);
            });
    });
};