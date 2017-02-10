const findCallback = require('../../lib/modules/findCallback');
const createObjectID = require('../../lib/modules/createObjectID');
const builder = require('../../lib/modules/queryBuilder');
const uuid = require('uuid');
const state = require('./state');

function findInvitation(req, cb) {

    const {invitation} = state.get(req);

    if (!invitation) {
        return cb(null, null);
    }

    const filter = {
        _id: createObjectID(state.invitation),
        expiration: {
            $gt: new Date()
        }
    };
    req.db.collection('__invitations__').findOne(filter, cb);
}

function genBearerToken(provider) {
    let exp = new Date();
    exp.setTime(exp.getTime() + (provider.expiration || 10 ) * 86400000);
    return {
        value: uuid(),
        expiration: exp
    };
}

function genUpdate(provider, profile, invitation) {
    let update = {$set: {}};
    update.$set.token = genBearerToken(provider);
    if (invitation) {
        update.$set.role = invitation.role;
        update.$set.invitation = invitation._id;
    }
    update.$set['identities.' + provider.name] = profile.identity;
    return update;
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

function genInsert(provider, profile, update) {
    let insert = {
        email: profile.email,
        displayName: profile.displayName,
        picture: profile.picture,
        identities: {}
    };

    insert.identities[provider.name] = profile.identity;
    insert.token = update.$set.token;

    return insert;
}

function deleteInvitation(db, invitation) {
    return db.collection('__invitations__').findOneAndDelete({_id: invitation._id});
}


module.exports = function passportMiddleware(req) {
    const users = req.db.collection('__users__');
    const provider = req.authProvider;
    proxyVerifyCallback(provider.callback, arguments, function (err, profile, passportCallback) {
        if (!profile || err) {
            return passportCallback('cannot find user');
        }
        findInvitation(req, (err, invitation) => {
            let filter = builder.filterUserByEmailOrProviderId(provider, profile);
            let update = genUpdate(provider, profile, invitation);
            users.findOneAndUpdate(filter, update, {returnOriginal: false})
                .then((result) => {
                    if (result.value) {
                        if (invitation && invitation.unique) {
                            deleteInvitation(req.db, invitation);
                        }
                        return passportCallback(null, result.value);
                    }

                    let insert = genInsert(provider, profile, update);
                    return users.insertOne(insert).then((insertResult) => passportCallback(null, insertResult.ops[0]));
                }).catch(passportCallback);
        });
    });
};