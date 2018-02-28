/* eslint-disable no-unused-expressions */
process.env.NODE_CONFIG_DIR = './test/config';
process.env.NODE_ENV = 'test';

const chai = require('chai');
const chaiHttp = require('chai-http');
const format = require('string-format');
const CampsiServer = require('../index');
const CampsiService = require('../lib/service');
const config = require('config');
const debug = require('debug')('campsi:test');

chai.use(chaiHttp);
format.extend(String.prototype);
chai.should();
let campsi;
let server;

class TestService extends CampsiService {
  initialize () {
    this.router.get('/', function (req, res) {
      res.json('true');
    });
    return super.initialize();
  }
}

describe('Prefix Test', function () {
  describe('Testing without prefix', function () {
    beforeEach((done) => {
      campsi = new CampsiServer(config.campsi);
      campsi.mount('test', new TestService(config.services.test));

      campsi.on('campsi/ready', () => {
        server = campsi.listen(config.port);
        done();
      });

      campsi.start()
        .catch((err) => {
          debug('Error: %s', err);
        });
    });

    afterEach((done) => {
      server.close();
      done();
    });

    it('Describe must works', function (done) {
      chai.request(campsi.app)
        .get('/')
        .end((err, res) => {
          if (err) debug(`received an error from chai: ${err.message}`);
          res.should.have.status(200);
          res.should.be.json;
          done();
        });
    });

    it('Service must works', function (done) {
      chai.request(campsi.app)
        .get('/test')
        .end((err, res) => {
          if (err) debug(`received an error from chai: ${err.message}`);
          res.should.have.status(200);
          res.should.be.json;
          done();
        });
    });
  });

  describe('Testing with a prefix', function () {
    beforeEach((done) => {
      campsi = new CampsiServer(config.campsiPrefix);
      campsi.mount('test', new TestService(config.services.test));

      campsi.on('campsi/ready', () => {
        server = campsi.listen(config.port);
        done();
      });

      campsi.start()
        .catch((err) => {
          debug('Error: %s', err);
        });
    });

    afterEach((done) => {
      server.close();
      done();
    });

    it('Root query must failed', function (done) {
      chai.request(campsi.app)
        .get('/')
        .end((err, res) => {
          if (err) debug(`received an error from chai: ${err.message}`);
          res.should.have.status(404);
          done();
        });
    });
    it('Describe must works', function (done) {
      chai.request(campsi.app)
        .get('/v1')
        .end((err, res) => {
          if (err) debug(`received an error from chai: ${err.message}`);
          res.should.have.status(200);
          res.should.be.json;
          done();
        });
    });
    it('Service must works', function (done) {
      chai.request(campsi.app)
        .get('/v1/test')
        .end((err, res) => {
          if (err) debug(`received an error from chai: ${err.message}`);
          res.should.have.status(200);
          res.should.be.json;
          done();
        });
    });
  });
});
