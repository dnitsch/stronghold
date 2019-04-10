'use strict';

var router = require('express').Router();
// var TerraWorker = require('./orchestrationWorker'); DEPRECATED
var RestModel = require('@amidoltd/shared-req-res-handler');

/**
 * Validate REST interface
 * param {*} req
 * body
 * params
 */
router.put('/init/:stage/:app_name/:commit_id/:provider?', function (req, res) {
    var _req = req;
    var TerraWorkerDirect = require('./orchestrationDirectInit');
    var terraWorkerDrct = new TerraWorkerDirect(RestModel.Reqst.fullObject(_req));
    terraWorkerDrct.initialize((e, d) => {
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
