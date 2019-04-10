'use strict';

const auth = require('basic-auth');

const secrets = require('./config/__secrets');

module.exports = function (request, response, next) {
    var _req = request;
    var user = auth(_req);
    if (!user || secrets.BASIC_AUTH.username !== user.name || secrets.BASIC_AUTH.password !== user.pass) {
        response.set('WWW-Authenticate', 'Basic realm="stronghold"');
        return response.status(401).send();
    } else {
        return next();
    }
};
