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

// 4xx Errors
module.exports.badRequest = function (res, err) {
  let body = {message: 'bad request'};
  buildBody(body, err);
  return res.status(400).json(body);
};

module.exports.unauthorized = function (res, err) {
  let body = {message: 'unauthorized'};
  buildBody(body, err);
  return res.status(401).json(body);
};

module.exports.forbidden = function (res, err) {
  let body = {message: 'forbidden'};
  buildBody(body, err);
  return res.status(403).json(body);
};

module.exports.notFound = function (res, err) {
  let body = {message: 'not found'};
  buildBody(body, err);
  res.status(404).json(body);
};

// 5xx Errors
module.exports.notImplemented = function (res, err) {
  let body = {message: 'not implemented'};
  buildBody(body, err);
  res.status(501).json(body);
};

module.exports.serviceNotAvailable = (res, err) => {
  let body = {message: 'service unavailable'};
  buildBody(body, err);
  res.status(503).json(body);
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
