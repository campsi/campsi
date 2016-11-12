'use strict';

module.exports = function(schema, db){
    return (req, res, next) => {
        req.schema = schema;
        req.db = db;
        next();
    }
};