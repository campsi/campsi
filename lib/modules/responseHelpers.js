module.exports.unauthorized = function unauthorized(res) {
    return res.status(403).json({message: 'unauthorized'});
};

module.exports.notFound = function notFound(res) {
    res.status(404).json({message: 'undefined resource'});
};

module.exports.error = function error(res, err) {
    function sendError() {
        res.status(400).json(err);
        return true;
    }

    return (err) ? sendError() : false;
};

module.exports.validationError = function validationError(res) {
    return function (errors) {
        return module.exports.error(res, {
            message: 'Validation Error',
            fields: errors
        });
    };
};

module.exports.notImplemented = (res)=> {
    res.status(500).json({message: 'not implemented'});
};

module.exports.serviceNotAvailable = (res)=> {
    res.status(503).json({message: 'service not available'});
};

module.exports.json = function json(res, body) {
    return res.json(body);
};
