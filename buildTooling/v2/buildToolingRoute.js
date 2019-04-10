'use strict';
/**
 * V2 build tooling
 */
const router = require('express').Router(),
    RestModel = require('@amidoltd/shared-req-res-handler'),
    buildFactory = require('./buildToolingFactory')();

/**
 * git checkout v2 sync/async
 */
router.post('/pipeline/checkout/:sha_id/:sync?', function (req, res) {
    const _req = req;

    buildFactory.gitCheckout(RestModel.Reqst.fullObject(_req), (e, d) => {
        if (e) {
            res.statusCode = 500;
            res.send(RestModel.Resp.errorResp(e, "PIPELINE310x5")); //TODO: stringify error response on app side
            res.end();
        } else {
            res.statusCode = d.statusCode || 202;
            res.send(RestModel.Resp.successResp({
                OK: true
            }));
            res.end();
        }
    });
});

/**
 * todo: standardise commit_id / sha_id
 */
router.post('/pipeline/configure/:stage/:app_name/:commit_id?/:provider?', function (req, res) {
    const _req = req;

    buildFactory.configure(RestModel.Reqst.fullObject(_req), (e, d) => {
        if (e) {
            res.statusCode = 500;
            res.send(RestModel.Resp.errorResp(e, "PIPELINE320x5")); //TODO: stringify error response on app side
            res.end();
        } else {
            res.statusCode = 202;
            res.send(RestModel.Resp.successResp({
                OK: true
            }));
            res.end();
        }
    });
});

router.post('/pipeline/provision/:stage/:app_name/:commit_id?/:provider?', function (req, res) {
    const _req = req;

    buildFactory.orchestrate(RestModel.Reqst.fullObject(_req), (e, d) => {
        if (e) {
            res.statusCode = 500;
            res.send(RestModel.Resp.errorResp(e, "PIPELINE330x5")); //TODO: stringify error response on app side
            res.end();
        } else {
            res.statusCode = 202;
            res.send(RestModel.Resp.successResp({
                OK: true
            }));
            res.end();
        }
    });
});

router.delete('/pipeline/destroy/:stage/:app_name/:commit_id?/:provider?', function (req, res) {
    const _req = req;

    buildFactory.destroy(RestModel.Reqst.fullObject(_req), (e, d) => {
        if (e) {
            res.statusCode = 500;
            res.send(RestModel.Resp.errorResp(e, "PIPELINE350x5"));  //TODO: stringify error response on app side
            res.end();
        } else {
            res.statusCode = 202;
            res.send(RestModel.Resp.successResp({OK: true}));
            res.end();
        }
    });
});


/**
 * GENERIC CLI runner interface
 * todo: standardise commit_id / sha_id
 * NOT YET IMPLEMENTED
 */
router.post('/pipeline/configure/:stage/:app_name/:commit_id?/:provider?', function (req, res) {
    const _req = req;

    buildFactory.configure(RestModel.Reqst.fullObject(_req), (e, d) => {
        if (e) {
            res.statusCode = 500;
            res.send(RestModel.Resp.errorResp(e, "PIPELINE360x5")); //TODO: stringify error response on app side
            res.end();
        } else {
            res.statusCode = 202;
            res.send(RestModel.Resp.successResp({
                OK: true
            }));
            res.end();
        }
    });
});


/**
 * Invokes specified Build CI server callback methods based on supplied parameters
 * current list of supported platforms [gitlab, jenkins, ]
 */
router.put('/pipeline/notify/:instruction?', function (req, res) {
    const _req = req;
    buildFactory.notify(RestModel.Reqst.fullObject(_req), (e, d) => {
        if (e) {
            res.statusCode = 500;
            res.send(RestModel.Resp.errorResp(e, "PIPELINE340x5")); //TODO: stringify error response on app side
            res.end();
        } else {
            res.statusCode = 202;
            res.send(RestModel.Resp.successResp({
                OK: true
            }));
            res.end();
        }
    });
});

module.exports = router;
