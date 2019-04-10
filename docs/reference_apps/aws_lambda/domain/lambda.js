'use strict';

const ObjectHandler = require('@anabode/shared_rest_responder');

exports.handler = async (event, context) => {
    try {
        return ObjectHandler.response.lambdaResp(JSON.parse(event), 200);
    } catch (ex) {
        console.error(ex);
        return ex;
    }
};
