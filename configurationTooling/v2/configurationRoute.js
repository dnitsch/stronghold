﻿'use strict';

const router = require('express').Router(),
    RestModel = require('@amidoltd/shared-req-res-handler'),
    configureFactory = require('./configurationFactory')();

/**
 * ConfigManager run
 * v2 more generic and should allow for greater control from invoker
 */
router.put('/playbook/:stage/:app_name/:commit_id?/:provider?', function (req, res) {
    const _req = req;
    configureFactory.playbookConfigure(RestModel.Reqst.fullObject(_req), (e, d) => {
        if (e) {
            res.statusCode = 500;
            res.send(RestModel.Resp.errorResp(e, "ANSIBLE160x5")); // TODO stringify error response on app side
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
