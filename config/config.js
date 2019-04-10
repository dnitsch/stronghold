'use strict';

const secrets = require('./__secrets'); // TODO: temporary fix before a

const Conf = {
    dev: {
        self: {
            base_url: process.env.BASE_URL || "http://localhost:1337/"
        },
        buildTool: {
            jenkins: {
                base_url: secrets.JENKINS_URL,
                credentials: { // needs to be coming from the vault asap!
                    user: "admin",
                    password: secrets.JENKINS_API_PWD
                },
                retry_count: 3,
                retry_timeout: 1500,
                callback_model: {
                    callback_url: null,
                    callback_ci_type: null
                }
            },
            gitlab: {
                base_url: secrets.GITLAB_URL,
                header: {
                    "PRIVATE-TOKEN": secrets.GITLAB_CI_API_TOKEN
                },
                callback_model: {
                    callback_url: null,
                    callback_next: null,
                    callback_pipeline_id: null,
                    callback_project_id: null,
                    callback_ci_type: null
                }
            },
            circle_ci: {},
            azure_devops: {}
        },
        configurationMgmt: {
            ansible: {
            }
        },
        orchestrationManagement: {
            terraform: {
                versions: {
                    stable: "1.11.0",
                    xperimental: "1.11.0"
                },
                provider: {
                    aws: {
                        lowest: "0.11.8"
                    }
                },
                modifiedFiles: {
                    aws: [
                        "vars.tf",
                        "main.tf"
                    ],
                    azure: [
                        "vars.tf",
                        "main.tf"
                    ],
                    openstack: [
                        "vars.tf",
                        "main.tf"
                    ]
                }
            }
        },
        collectd: {
            base_url: "https://dev.collectd.tech.domain.com/collectd/metrics",
            version_latest: "v4"
        },
        scm: {
            basePath: '/var/idam-test-clone'
        },
        logConfig: {
            namespace: "myorg",
            cloudwatch: {
                logGroup: process.env.CW_LOG_GROUP_BASE || '/myorg/sharedservices' //process.env.CW_LOG_GROUP_BASE ||
            },
            elasticsearch: {
                logGroup: '/myorg/sharedservices' // process.env.CW_LOG_GROUP_BASE ||
            }
        }
    },
    staging: {
    },
    container: {
    }
};

module.exports = Conf;
