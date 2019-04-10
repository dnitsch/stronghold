'use strict';

const router = require('express').Router(),
    _ = require( 'lodash');

/* GET home page. */
router.get('/', function (req, res) {
    const _req = req;
    if (_.isUndefined(req.query.debug)) {
        const render = { title: 'Stronghold'};
        res.render('stronghold', render)
    } else {
        const render = {
            title: 'Stronghold Debug!',
            headerStuff: JSON.stringify(req.headers),
            strongholdEnvVars: JSON.stringify(process.env)
        };
        // res.render('stronghold_debug', render);
        res.send(render);
        res.end();
    }
});

module.exports = router;
