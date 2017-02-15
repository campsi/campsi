const debug = require('debug')('campsi');
const editURL = require('edit-url');
const {atob, btoa} = require('./modules/base64');

function getState(req) {
    let state = {};
    let decoded;

    if (req.query.state) {
        try {
            decoded = atob(req.query.state);
            state = JSON.parse(decoded);
        } catch (err) {
            debug('wrong state parameter, must be base64 encoded JSON object');
        }
    }
    else if (req.session.state) {
        state = req.session.state;
    }
    return state;
}

module.exports.get = getState;

/**
 * @param {ExpressRequest} req
 * @return {String} Base64 encoded JSON object
 */
module.exports.serialize = function (req) {
    let state = getState(req);

    if (!state.redirectURI && req.headers.referer) {
        state.redirectURI = editURL(req.headers.referer, (urlObj) => {
            delete urlObj.query.token;
        });
    }

    if (req.query.invitation) {
        state.invitation = req.query.invitation;
    }

    const json = JSON.stringify(state);

    if (json !== '{}') {
        req.session.state = state;
        req.query.state = btoa(JSON.stringify(state));
        return req.query.state;
    }

    return '';
};
