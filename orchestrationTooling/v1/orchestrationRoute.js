'use strict';

const router = require('express').Router(),
    RestModel = require('@amidoltd/shared-req-res-handler'),
    orchestrationFactory = require('./orchestrationFactory')();


/**
 * Validate REST interface
 * param {*} req
 * body
 * params
 */
router.put('/init/:stage/:app_name/:commit_id/:provider?', function (req, res) {
    const _req = req;
    orchestrationFactory.init(RestModel.Reqst.fullObject(_req), (e, d) => {
        if (e) {
            res.statusCode = 500;
            res.send(RestModel.Resp.errorResp(e, "TERRAFORM120x5"));
            res.end();
        } else {
            res.statusCode = 200;
            res.send(RestModel.Resp.successResp(d));
            res.end();
        }
    });
});

module.exports = router;
