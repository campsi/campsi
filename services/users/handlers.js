const helpers = require('../../lib/modules/responseHelpers');
const createObjectID = require('../../lib/modules/createObjectID');

module.exports.getInvitation = function (req, res) {
    req.db.collection('__invitations__')
        .findOne({_id: createObjectID(req.params.invitation)})
        .then((invitation) => {
            return helpers.json(res, invitation);
        })
        .catch((err) => helpers.error(res, err));
};

module.exports.createInvitation = function (req, res) {
    const now = new Date();
    const exp = new Date(now.getTime() + 10 * 24 * 60);
    const defaults = {
        expiration: exp,
        unique: true
    };

    if (!req.body.role || !req.schema.roles[req.body.role]) {
        return helpers.error(res, 'missing role');
    }

    const invitation = Object.assign({}, defaults, req.body);

    req.db.collection('__invitations__').insertOne(invitation)
        .then((result) => helpers.json(res, result.ops[0]))
        .catch((err) => helpers.error(res, err));
};

module.exports.listUsers = function (req, res) {
    req.db.collection('__users__').find().toArray().then((users) => {
        helpers.json(res, users);
    }).catch((err) => helpers.error(res, err));
};

module.exports.editUser = function (req, res) {
    res.json({});
};

module.exports.getUser = function (req, res) {
    res.json({});
};