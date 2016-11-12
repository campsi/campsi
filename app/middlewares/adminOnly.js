'use strict';

const helpers = require('../modules/responseHelpers');
module.exports = (req, res, next)=> {
    if (req.user && req.schema.roles[req.user.role].admin === true) {
        return next();
    }
    helpers.unauthorized(res);
};