'use strict';

const debug = require('debug')('campsi');
const request = require('request');

/**
 * @param {Object} req
 * @param data
 */
module.exports = function sendWebhook(req, data) {
    let hooks = req.resource.webhooks || [];
    hooks.forEach((hook)=> {
        if (hook.on.indexOf(req.method) === -1 && hook.on !== '*') {
            return;
        }
        if (hook.states.indexOf(req.state) === -1) {
            return;
        }

        request({
            method: hook.method,
            headers: hook.headers,
            uri: hook.uri,
            json: true,
            body: data
        }, (err, res) => {
            if (err || String(res.statusCode)[0] !== '2') {
                debug('Webhook error: %s [%s] %s', req.method, req.state, err);
                /*console.error({
                    message: 'webhook error',
                    method: req.method,
                    state: req.state,
                    hook: hook,
                    err: err,
                    statusCode: res ? res.status : 0
                });*/

                return;
            }
        });
    });
};
