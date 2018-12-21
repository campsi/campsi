const forIn = require('for-in');
const debug = require('debug')('campsi');

// Helpers
function buildBody (body, err) {
  if (err instanceof Error) {
    body.message = err.message;
    if (process.env.CAMPSI_DEBUG === '1') {
      body.stack = err.stack.split('\n');
    }
  } else if (typeof err !== 'undefined') {
    debug('Response Helpers received a bad error instance');
  }
}

function send (res, status, body) {
  return res.headersSent ? null : res.status(status).json(body);
}

// 4xx Errors
module.exports.badRequest = function (res, err) {
  let body = {message: 'bad request'};
  buildBody(body, err);
  send(res, 400, body);
};

module.exports.unauthorized = function (res, err) {
  let body = {message: 'unauthorized'};
  buildBody(body, err);
  send(res, 401, body);
};

module.exports.forbidden = function (res, err) {
  let body = {message: 'forbidden'};
  buildBody(body, err);
  send(res, 403, body);
};

module.exports.notFound = function (res, err) {
  let body = {message: 'not found'};
  buildBody(body, err);
  send(res, 404, body);
};

// 5xx Errors
module.exports.notImplemented = function (res, err) {
  let body = {message: 'not implemented'};
  buildBody(body, err);
  send(res, 501, body);
};

module.exports.serviceNotAvailable = (res, err) => {
  let body = {message: 'service unavailable'};
  buildBody(body, err);
  send(res, 503, body);
};

// Advanced Error handlers
module.exports.error = function (res, err) {
  let result = false;
  if (err) {
    module.exports.badRequest(res, err);
    result = true;
  }
  return result;
};

module.exports.validationError = function validationError (res) {
  return function (errors) {
    return module.exports.error(res, {
      message: 'Validation Error',
      fields: errors
    });
  };
};

// Json Helper
module.exports.json = function json (res, body, headers) {
  if (headers) {
    forIn(headers, (value, key) => {
      res.header(key, value);
    });
  }
  return res.json(body);
};
