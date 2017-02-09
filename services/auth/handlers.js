const helpers = require('../../lib/modules/responseHelpers');

const forIn = require('for-in');
const passport = require('passport');
const editURL = require('edit-url');
const state = require('./state');
const {btoa} = require('../../lib/modules/base64');

function logout(req, res) {
    let update = {$set: {token: 'null'}};
    req.db.collection('__users__')
        .findOneAndUpdate({_id: req.user._id}, update).then((result) => {
        return res.json(result);
    }).catch((error) => {
        return helpers.error(res, error);
    });
}

function me(req, res) {
    res.json(req.user);
}

function getProviders(req, res) {
    let ret = [];
    forIn(req.authProviders, (provider, name) => {
        ret.push({
            name: name,
            title: provider.title,
            buttonStyle: provider.buttonStyle,
            scope: provider.scope
        });
    });

    ret.sort((a, b) => a.order - b.order);
    res.json(ret)
}


function callback(req, res) {
    const {redirectURI} = state.get(req);
    //noinspection JSUnresolvedFunction
    passport.authenticate(
        req.authProvider.name,
        {session: false}
    )(req, res, () => {
        if (!req.user) {
            return redirectWithError(req, res);
        }

        const token = btoa(JSON.stringify(req.user.token));

        if (!redirectURI) {
            res.json(token);
        } else {
            res.redirect(editURL(redirectURI, (obj) => obj.query.token = token));
        }

        req.session.destroy(() => {
            //console.info('session destroyed');
        })
    });
}

function redirectWithError(req, res) {
    const {redirectURI} = state.get(req);
    if (!redirectURI) {
        helpers.error(res, 'auth error');
    } else {
        res.redirect(editURL(redirectURI, (obj) => obj.query.error = true));
    }
}


/**
 * Entry point of the authentification workflow.
 * There's no req.user yet.
 *
 * @param req
 * @param res
 * @param next
 */
function initAuth(req, res, next) {
    const params = {
        session: false,
        state: state.serialize(req),
        scope: req.authProvider.scope
    };

    //noinspection JSUnresolvedFunction
    passport.authenticate(
        req.params.provider,
        params
    )(req, res, next);
}

module.exports = {
    initAuth,
    redirectWithError,
    callback,
    getProviders,
    me,
    logout
};