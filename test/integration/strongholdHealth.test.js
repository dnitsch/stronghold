'use strict';

const chai = require('chai');
const chaiHttp = require('chai-http');
const app = require('../../app');

chai.use(chaiHttp);
chai.should();

describe('HealthCheck', function() {
    describe('/GET healthcheck', function() {
        it('it should GET the healthcheck object and validate its properties', function(done) {
            chai.request(app)
                .get('/stronghold?debug')
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.be.an('object');
                    res.body.should.have.property('title');
                    res.body.should.have.property('headerStuff');
                    res.body.should.have.property('strongholdEnvVars');
                    return done();
                });
        })
    })
})
