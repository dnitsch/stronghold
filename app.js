'use strict';

const createError = require('http-errors'),
    _ = require('lodash'),
    express = require('express'),
    path = require('path'),
    cookieParser = require('cookie-parser'),
    logger = require('morgan'),
    winston = require('./sharedWorkers/logger'),
    auth = require('./auth');

process.env.HOSTNAME = require('os').hostname();

// ROUTES
const home = require('./strongholdHome/index'),
    configurationv2 = require('./configurationTooling/v2/configurationRoute'),
    orchestrationv1 = require('./orchestrationTooling/v1/orchestrationRoute'),
    orchestrationv2 = require('./orchestrationTooling/v2/orchestrationRoute'),
    buildv2 = require('./buildTooling/v2/buildToolingRoute');

const app = express();

app.use(logger('combined', {stream: winston.stream}));
app.use(express.json());
app.use(express.urlencoded({
    extended: false
}));
app.use(cookieParser());

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// USE BASIC AUTH
if (!_.isUndefined(process.env.AUTH_MODE) && process.env.AUTH_MODE == 'basic') {
    app.use(auth);
}

/// route definitions
app.use('/stronghold', home);
app.use('/configuration/v2', configurationv2);
app.use('/orchestration/v1', orchestrationv1);
app.use('/orchestration/v2', orchestrationv2);
app.use('/build/v2', buildv2);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
    return res.status(err.status || 500).json({
        responseData: ((process.env.NODE_ENV === 'dev') ? `${err.message} ${err.stack}` : err.message),
        code: 'ASSEMBLY_API999x5'
    });
});

module.exports = app;
