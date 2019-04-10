'use strict';

const sinon = require('sinon'),
    chai = require('chai'),
    chaiHttp = require('chai-http'),
    app = require('../../../app'),
    config = require('../../config');
    // buildFactory = require('../../../buildTooling/v2/buildToolingFactory')();
    // ProvisionCreate = require('../../../buildTooling/v2/buildToolingWorkerProvisionCreate'),
    // Checkout = require('../../../buildTooling/v2/buildToolingWorkerGitCheckout'),
    // Configure = require('../../../buildTooling/v2/buildToolingWorkerConfigure'),
    // Destroy = require('../../../buildTooling/v2/buildToolingWorkerProvisionDestroy'),
    // Notify = require('../../../buildTooling/v2/buildToolingCiServerCallback');

chai.should();
