'use strict';

function btoa(str) {
    const buff = new Buffer(str);
    let encoded;
    try {
        encoded = buff.toString('base64');
    } catch (err) {
        console.error(err);
    }
    return encoded;
}

function atob(str) {
    if (!str) {
        return '';
    }
    const buff = new Buffer(str, 'base64');
    let decoded;
    try {
        decoded = buff.toString('binary');
    } catch (err) {
        console.error(err);
    }
    return decoded;
}

module.exports = {atob, btoa};
