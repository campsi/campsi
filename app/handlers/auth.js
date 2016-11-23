/**
 * @todo move functions to builder
 */

'use strict';

process.on('unhandledRejection', (reason) => {
    console.log('Reason: ' + reason);
    console.info(new Error().stack);
});

const helpers = require('../modules/responseHelpers');
const passport = require('passport');
const forIn = require('for-in');
const uuid = require('uuid');
const url = require('url');
const editURL = require('edit-url');
const {atob, btoa} = require('../modules/base64');
const {ObjectID} = require('mongodb');
const CryptoJS = require('crypto-js');

const getCb = function (args) {
    let i = 0;
    for (; i < args.length; i++) {
        if (typeof args[i] === 'function') {
            return {callback: args[i], index: i};
        }
    }
};


const findInvitation = (req, db, cb)=> {

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
    db.collection('__invitations__').findOne(filter, cb);
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

const filterUserByEmailOrProviderId = (provider, profile)=> {
    let query = {$or: []};
    let identityIdFilter = {};
    identityIdFilter['identities.' + provider.name + '.id'] = profile.identity.id;
    query.$or.push(identityIdFilter);

    if (profile.email) {
        query.$or.push({email: profile.email});
    }

    return query;
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

}

function logout(req, res, next) {

}

function testPassword(provider, user, password) {
    const decrypted = CryptoJS.AES.decrypt(
        user.identities.local.password,
        provider.options.salt
    ).toString(CryptoJS.enc.Utf8);
    return password === decrypted;
}

function localCallback(db, provider) {
    return function (req, username, password, done) {
        let filter = {};
        filter['identities.local.username'] = username;
        db.collection('__users__').findOne(filter).then((user)=> {
            if (user && user.identities.local && testPassword(provider, user, password)) {
                user.identity = user.identities.local;
                return done(null, user);
            }

            done(null, null);
        }).catch(done);
    }
}

function proxyVerifyCallback(fn, args, done) {
    const {callback, index} = getCb(args);
    args[index] = function (err, user) {
        done(err, user, callback);
    };
    fn.apply(null, args);
}

module.exports = function (db, authProviders) {

    const users = db.collection('__users__');

    forIn(authProviders, (provider, providerName)=> {

        provider.options.passReqToCallback = true;
        provider.options.scope = provider.scope;
        provider.name = providerName;

        if (providerName === 'local') {
            provider.callback = localCallback(db, provider);
        }

        // VERY IMPORTANT WARNING
        // DO NOT REPLACE this ––––––––––––––––––––––––––––––––––––––––––––|
        // BY A LAMBDA FUNCTION                                            v
        passport.use(providerName, new provider.Strategy(provider.options, function (req) {
            proxyVerifyCallback(provider.callback, arguments, (err, profile, passportCallback)=> {
                if (!profile || err) {
                    console.error('no user returned by provider callback', err, profile);
                    return passportCallback('cannot find user');
                }
                findInvitation(req, db, (err, invitation)=> {
                    let filter = filterUserByEmailOrProviderId(provider, profile);
                    let update = genUpdate(provider, profile, invitation);

                    users.findOneAndUpdate(filter, update, {returnOriginal: false})
                        .then((result)=> {
                            if (result.value) {
                                if (invitation && invitation.unique) {
                                    deleteInvitation(db, invitation);
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
        }));
    });

    const getAuthProvider = (req, res)=> {
        return authProviders[req.params.strategy];
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
     * @param req
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
        const strategy = getAuthProvider(req, res);
        const state = getState(req);
        if (strategy) {
            passport.authenticate(
                req.params.strategy,
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
                req.session.destroy(()=>{
                    //console.info('session destroyed');
                })
            });
        } else {
            return redirectWithError(req, res);
        }
    };

    const redirectWithError = (req, res)=> {
        console.info('redirectWithError', new Error().stack);
        const state = getState(req);
        res.redirect(editURL(state.redirectURI, (obj)=> obj.query.error = true));
    };

    const register = (req, res)=> {
        const localProvider = getAuthProvider(req, res);
        if (!localProvider) {
            return;
        }

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

        db.collection('__users__').insertOne(user)
            .then((result)=> {
                authCallback(req, res)
            })
            .catch((err)=> redirectWithError(req, res));
    };

    return {

        /**
         * Entry point of the authentification workflow.
         * There's no req.user yet.
         *
         * @param req
         * @param res
         * @param next
         */
        initAuth: (req, res, next) => {
            const strategy = getAuthProvider(req, res);
            const params = {
                session: false,
                state: serializeState(req),
                scope: strategy.scope
            };

            if (strategy) {
                passport.authenticate(
                    req.params.strategy,
                    params
                )(req, res, next);
            }
        },
        callback: authCallback,
        /**
         * @param req
         * @param res
         */
        getProviders: (req, res)=> {
            let ret = [];
            forIn(authProviders, (provider, name)=> {
                ret.push({
                    name: name,
                    order: provider.order,
                    title: provider.title,
                    buttonStyle: provider.buttonStyle,
                    scope: provider.scope
                });
            });

            ret.sort((a, b)=>a.order - b.order);
            res.json(ret)
        },

        local: (req, res, next)=> {
            // hack the request to make it look like a legit passport req
            req.params.strategy = 'local';
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
    }
};
