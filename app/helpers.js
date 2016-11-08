'use strict';

module.exports.unauthorized = function unauthorized(res) {
    return res.json(403, {message: 'unauthorized'}, {});
};

module.exports.notFound = function notFound(res) {
    res.json(404, {message: 'undefined resource'}, {});
};

module.exports.error = function error(res, err) {
    function sendError() {
        res.json(400, err, {});
        return true;
    }

    return (err) ? sendError() : false;
};

module.exports.json = function json(res, body) {
    return res.json(200, body, {});
};