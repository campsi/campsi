/* eslint-disable no-unused-expressions */
process.env.NODE_CONFIG_DIR = './test/config';
process.env.NODE_ENV = 'test';

const chai = require('chai');
const chaiHttp = require('chai-http');
const express = require('express');
const responseHelpers = require('../lib/modules/responseHelpers');
const format = require('string-format');
const debug = require('debug')('campsi:test');

chai.use(chaiHttp);
format.extend(String.prototype);
chai.should();

let errors = [{
  describe: '400 Bad Request',
  function: 'badRequest',
  code: 400
}, {
  describe: '401 Unauthorized',
  function: 'unauthorized',
  code: 401
}, {
  describe: '403 Forbidden',
  function: 'forbidden',
  code: 403
}, {
  describe: '404 Not Found',
  function: 'notFound',
  code: 404
}, {
  describe: '501 Not Implemented',
  function: 'notImplemented',
  code: 501
}, {
  describe: '503 Service Not Available',
  function: 'serviceNotAvailable',
  code: 503
}];

describe('Errors Test', function () {
  errors.forEach((error) => {
    describe(error.describe, function () {
      it('should return the correct message, no stack', function (done) {
        let app = express();
        process.env.CAMPSI_DEBUG = 0;
        app.get('/errorPath', function (req, res) {
          responseHelpers[error.function](res, new Error('Test Error'));
        });
        chai.request(app)
          .get('/errorPath')
          .end((err, res) => {
            if (err) debug(`received an error from chai: ${err.message}`);
            res.should.have.status(error.code);
            res.should.be.json;
            res.body.should.be.an('object');
            res.body.should.have.property('message');
            res.body.message.should.be.eq('Test Error');
            res.body.should.not.have.property('stack');
            done();
          });
      });
      it('should return the correct message & stack', function (done) {
        let app = express();
        process.env.CAMPSI_DEBUG = 1;
        app.get('/errorPath', function (req, res) {
          responseHelpers[error.function](res, new Error('Test Error'));
        });
        chai.request(app)
          .get('/errorPath')
          .end((err, res) => {
            if (err) debug(`received an error from chai: ${err.message}`);
            res.should.have.status(error.code);
            res.should.be.json;
            res.body.should.be.an('object');
            res.body.should.have.property('message');
            res.body.message.should.be.eq('Test Error');
            res.body.should.have.property('stack');
            debug(res.body);
            done();
          });
      });
    });
  });
});
