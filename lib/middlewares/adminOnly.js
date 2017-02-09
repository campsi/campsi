'use strict';

const helpers = require('../modules/responseHelpers');
module.exports = (req, res, next)=> {
    if (req.user && req.user.isAdmin === true) {
        return next();
    }
    helpers.unauthorized(res);
};