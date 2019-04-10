'use strict';

var router = require('express').Router(),
    RestModel = require('@amidoltd/shared-req-res-handler');
let orchestrationFactory = require('./orchestrationFactory')();

/**
 * Manage workspace wrapper V2
 * @param  {command/:environment/:build_id'} '/v1/workspace/
 * @param  {} function(req
 * @param  {} res
 */
router.post('/workspace/:stage/:app_name/:commit_id/:provider?', function (req, res) {

    var _req = req;

    orchestrationFactory.workspaceCreate(RestModel.Reqst.fullObject(_req), (e, d) => {
        if (e) {
            res.statusCode = 500;
            res.send(RestModel.Resp.errorResp(e, "TERRAFORM190x5"));
            res.end();
        } else {
            res.statusCode = 202;
            res.send(RestModel.Resp.successResp(d));
            res.end();
        }
    });
});

/**
 * Manage workspace wrapper V2
 * @param  {command/:environment/:build_id'} '/v1/workspace/
 * @param  {} function(req
 * @param  {} res
 */
router.delete('/workspace/:stage/:app_name/:commit_id/:provider?', function (req, res) {

    var _req = req;

    orchestrationFactory.workspaceDelete(RestModel.Reqst.fullObject(_req), (e, d) => {
        if (e) {
            res.statusCode = 500;
            res.send(RestModel.Resp.errorResp(e, "TERRAFORM1100x5"));
            res.end();
        } else {
            res.statusCode = 202;
            res.send(RestModel.Resp.successResp(d));
            res.end();
        }
    });
});

/**
 * Manage workspace wrapper V2
 * @param  {command/:environment/:build_id'} '/v1/workspace/
 * @param  {} function(req
 * @param  {} res
 */
router.post('/generic/:stage/:app_name/:commit_id/:provider?', function (req, res) {
    var _req = req;
    // var orcWorker = new (require('./orchestrationGeneric'))(RestModel.Reqst.fullObject(_req));
    // orcWorker.((e, d) => {
    orchestrationFactory.genericOrchestrate(RestModel.Reqst.fullObject(_req), (e, d) => {
        if (e) {
            res.statusCode = 500;
            res.send(RestModel.Resp.errorResp(e, "TERRAFORM1100x5"));
            res.end();
        } else {
            res.statusCode = 202;
            res.send(RestModel.Resp.successResp(d));
            res.end();
        }
    });
});

module.exports = router;
