'use strict';

module.exports.btoa = function (str) {
    return new Buffer(str).toString('base64');
};

module.exports.atob = function (str) {
    return new Buffer(str, 'base64').toString('binary');
};
