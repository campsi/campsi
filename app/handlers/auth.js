/**
 * @todo move functions to builder
 */

'use strict';

const helpers = require('../modules/responseHelpers');
const builder = require('../modules/queryBuilder');
const forIn = require('for-in');
const uuid = require('uuid');
const editURL = require('edit-url');
const {atob, btoa} = require('../modules/base64');
const {ObjectID} = require('mongodb');
/**
 * @property AES
 * @property enc
 * @type {CryptoJS}
 */
const CryptoJS = require('crypto-js');


/**
 *
 * @type {Passport}
 */
const passport = require('passport');


const router = require('express').Router();
const findCallback = require('../modules/findCallback');


const findInvitation = (req, cb)=> {

    // todo session state
    if (!req.query.state) {
        return cb(null, null);
    }

    const state = JSON.parse(atob(req.query.state));

    if (!state.invitation) {
        return cb(null, null);
    }

    const filter = {
        _id: ObjectID(state.invitation),
        expiration: {
            $gt: new Date()
        }
    };
    req.db.collection('__invitations__').findOne(filter, cb);
};

const deleteInvitation = (db, invitation)=> {
    db.collection('__invitations__')
        .findOneAndDelete({_id: invitation._id})
        .then((ops)=> {
            console.info('invitation deleted', ops)
        })
        .catch((err)=> {
            console.error(err)
        });
};


const genBearerToken = (provider)=> {
    let exp = new Date();
    exp.setTime(exp.getTime() + (provider.expiration || 10 ) * 86400000);
    return {
        value: uuid(),
        expiration: exp
    };
};

const genUpdate = (provider, profile, invitation)=> {
    let update = {$set: {}};
    update.$set.token = genBearerToken(provider);
    if (invitation) {
        update.$set.role = invitation.role;
        update.$set.invitation = invitation._id;
    }
    update.$set['identities.' + provider.name] = profile.identity;
    return update;
};

const genInsert = (provider, profile, update)=> {
    let insert = {
        email: profile.email,
        displayName: profile.displayName,
        picture: profile.picture,
        identities: {}
    };

    insert.identities[provider.name] = profile.identity;
    insert.token = update.$set.token;

    return insert;
};

function resetPassword(req, res) {
    return helpers.notImplemented(res);
}

function logout(req, res) {
    return helpers.notImplemented(res);
}

function testPassword(provider, user, password) {
    const decrypted = CryptoJS.AES.decrypt(
        user.identities.local.password,
        provider.options.salt
    ).toString(CryptoJS.enc.Utf8);
    return password === decrypted;
}

const localCallback = function (req, username, password, done) {
    let filter = {};
    filter['identities.local.username'] = username;
    req.db.collection('__users__').findOne(filter).then((user)=> {
        if (user && user.identities.local && testPassword(req.authProvider, user, password)) {
            user.identity = user.identities.local;
            return done(null, user);
        }
        done(null, null);
    }).catch(done);
};

function local(req, res, next) {
    // hack the request to make it look like a legit passport req
    req.authProvider = req.config.handlers.auth.options.providers.local;
    serializeState(req);
    switch (req.body.action) {
        case 'register':
            return register(req, res, next);
        case 'signin':
            return authCallback(req, res, next);
        case 'reset-password':
            return resetPassword(req, res, next);
        case 'logout':
            return logout(req, res, next);
    }
    helpers.error(res, 'missing action parameter');
}

/**
 * @param {ExpressRequest} req
 * @return {String} Base64 encoded JSON object
 */
const serializeState = (req) => {
    let state = getState(req);

    if (!state.redirectURI && req.headers.referer) {
        state.redirectURI = editURL(req.headers.referer, (urlObj)=> {
            delete urlObj.query.token;
        });
    }

    if (req.query.invitation) {
        state.invitation = req.query.invitation;
    }

    req.session.state = state;
    req.query.state = btoa(JSON.stringify(state));
    return req.query.state;
};

const getState = (req) => {
    let state = {};
    if (req.query.state) {
        try {
            state = JSON.parse(atob(req.query.state));
        } catch (err) {
            console.error('wrong state parameter, must be base64 encoded JSON object')
        }
    } else if (req.session.state) {
        state = req.session.state;
    }
    return state;
};


/**
 * Function called after the auth provider and
 * the PassportJS middleware did their part.
 *
 * Arrived here, the auth has been successful,
 * and `req.user is` is populated with a valid
 * token for Bearer auth.
 *
 * The user will return to the login page that
 * initiated the auth with the auth infos in the
 * token parameter in the query string.
 *
 * The token is base64 encoded JSON object, containing
 * the displayName, email and Bearer Token
 *
 * @param req
 * @param res
 */
const authCallback = (req, res)=> {
    const state = getState(req);
    //noinspection JSUnresolvedFunction
    passport.authenticate(
        req.authProvider.name,
        {session: false}
    )(req, res, ()=> {
        if (!req.user) {
            return redirectWithError(req, res);
        }

        const token = btoa(JSON.stringify({
            displayName: req.user.displayName,
            email: req.user.email,
            token: req.user.token
        }));
        res.redirect(editURL(state.redirectURI, (obj)=> obj.query.token = token));
        req.session.destroy(()=> {
            //console.info('session destroyed');
        })
    });
};

const redirectWithError = (req, res, err)=> {
    err = err || new Error();
    console.info('redirectWithError', err.stack);
    const state = getState(req);
    res.redirect(editURL(state.redirectURI, (obj)=> obj.query.error = true));
};

const register = (req, res)=> {
    const localProvider = req.authProvider;
    const encryptedPassword = CryptoJS.AES.encrypt(req.body.password, localProvider.options.salt).toString();
    let user = {
        displayName: req.body.displayName,
        email: req.body.email || req.body.username,
        identities: {
            local: {
                id: req.body.username,
                username: req.body.username,
                password: encryptedPassword
            }
        }
    };

    req.db.collection('__users__').insertOne(user)
        .then(()=> authCallback(req, res))
        .catch((err)=> redirectWithError(req, res, err));
};


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
        state: serializeState(req),
        scope: req.authProvider.scope
    };

    //noinspection JSUnresolvedFunction
    passport.authenticate(
        req.params.provider,
        params
    )(req, res, next);
}

/**
 * @param req
 * @param res
 */
function getProviders(req, res) {
    let ret = [];
    forIn(req.config.handlers.auth.options.providers, (provider, name)=> {
        ret.push({
            name: name,
            order: provider.order || 1,
            title: provider.title,
            buttonStyle: provider.buttonStyle,
            scope: provider.scope
        });
    });

    ret.sort((a, b)=>a.order - b.order);
    res.json(ret)
}


/**
 *
 * @param req
 */
function passportMiddleware(req) {
    const users = req.db.collection('__users__');
    const provider = req.authProvider;
    proxyVerifyCallback(provider.callback, arguments, (err, profile, passportCallback)=> {
        if (!profile || err) {
            console.error('no user returned by provider callback', err, profile);
            return passportCallback('cannot find user');
        }
        findInvitation(req, (err, invitation)=> {
            let filter = builder.filterUserByEmailOrProviderId(provider, profile);
            let update = genUpdate(provider, profile, invitation);
            users.findOneAndUpdate(filter, update, {returnOriginal: false})
                .then((result)=> {
                    if (result.value) {
                        if (invitation && invitation.unique) {
                            deleteInvitation(req.db, invitation);
                        }
                        return passportCallback(null, result.value);
                    }

                    let insert = genInsert(provider, profile, update);

                    users
                        .insertOne(insert)
                        .then((insertResult)=> passportCallback(null, insertResult.ops[0]))
                        .catch(passportCallback);

                }).catch(passportCallback);
        });
    });
}

/**
 * Intercepts passport callback
 * @param fn
 * @param args
 * @param done
 */
function proxyVerifyCallback(fn, args, done) {
    const {callback, index} = findCallback(args);
    args[index] = function (err, user) {
        done(err, user, callback);
    };
    fn.apply(null, args);
}


module.exports = function (server, options, cb) {
    forIn(options.providers, (provider, providerName)=> {
        provider.options.passReqToCallback = true;
        provider.options.scope = provider.scope;
        provider.name = providerName;
        if (providerName === 'local') {
            provider.callback = localCallback;
        }

        //noinspection JSUnresolvedFunction
        passport.use(
            providerName,
            new provider.Strategy(provider.options, passportMiddleware)
        );
    });

    router.param('provider', function (req, res, next, id) {
        req.authProvider = options.providers[id];
        return (!req.authProvider) ? helpers.notFound(res) : next();
    });

    router.get('/providers', getProviders);
    router.use('/local', local);
    router.post('/local', local);
    router.get('/:provider', initAuth);
    router.get('/:provider/callback', authCallback);

    cb(router);
};