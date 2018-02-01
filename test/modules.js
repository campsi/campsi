const chai = require('chai');
const chaiHttp = require('chai-http');
const express = require('express');
const buildLink = require('../lib/modules/buildLink');
const createObjectID = require('../lib/modules/createObjectID');
const format = require('string-format');

chai.use(chaiHttp);
format.extend(String.prototype);
chai.should();
const {URL} = require('url');

describe('Modules Test', function(){
    describe('buildLink module', function(){
        it('should return the correct url', function(done){
            var app = express();

            app.get('/test', function(req, res) {
                let url = buildLink(req, 2, ['foo', 'unknown']);
                res.json(url);
                res.end();
            });

            chai.request(app)
                .get('/test?foo=bar&dont=keep')
                .end((err, res) => {
                    res.should.have.status(200);
                    let url = new URL(res.body);
                    url.should.have.property('pathname');
                    url.pathname.should.equal('/test');
                    url.should.have.property('searchParams');
                    url.searchParams.get('page').should.equal('2');
                    url.searchParams.get('foo').should.equal('bar');
                    url.searchParams.has('unknown').should.equal(false);
                    url.searchParams.has('dont').should.equal(false);
                    done();
                });
        });
    });

    describe('createObjectID module', function(){
        it('should return a correct objectID', function(done){
            const oid = createObjectID('507f1f77bcf86cd799439011');
            oid.should.be.a('object');
            done();
        });

        it('should return an incorrect objectID', function(done){
            const oid = createObjectID('507f1f77bcf86cd79943901');
            (typeof oid).should.be.equal('undefined');
            done();
        });
    });
});
