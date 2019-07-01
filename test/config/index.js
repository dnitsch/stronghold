'use strict';
// jshint expr:true
const Config = {
   orchestrate: {
       init: {
           params: { stage: "dev", app_name: "test", commit_id: "29hu9efwhn89esfh90dhrsvh80h30h80"},
           header: {},
           query: {},
           body: {
            envVars: {
                TF_LOG: "1"
              },
              execCommand: "/var/idam/infrastructure/exec/terraform",
              cwd: "/var/myorg/idam/local/vagrant/orchestration/idam"
           }
       }
   },
   configure: {
        runplaybook: {
            params: { stage: "dev", app_name: "test", commit_id: "29hu9efwhn89esfh90dhrsvh80h30h80", provider: "aws"},
            header: {},
            query: {},
            body: {
                STRONGHOLD_tf_init: true,
                STRONGHOLD_cfg_exec: "ansible-playbook",
                STRONGHOLD_cfg_command: ["-i", "/var/idam/libs/pyModules/terraform.py", "ping/federate/master.yml"],
                STRONGHOLD_cfg_cwd: "/var/idam/identity-management/configuration/playbooks",
                envVars: {
                    ANSIBLE_TF_BIN: "/var/idam/infrastructure/exec/terraform",
                    ANSIBLE_TF_DIR: "/var/idam/identity-management/orchestration/identity-management",
                    ANSIBLE_TF_WS_NAME: "dev-06df57d131a97cb145edb4ea00b57eaa039edf4a",
                    ANSIBLE_LIBRARY: "/var/idam/libs/configuration/modules/",
                    ANSIBLE_VAULT_PASSWORD_FILE: "/var/idam/infrastructure/keys/vault-password-file",
                    ANSIBLE_SSH_RETRIES: 5,
                    ANSIBLE_DEBUG: 1,
                    ANSIBLE_HOST_KEY_CHECKING: false,
                    ANSIBLE_CONFIG: "/var/idam/identity-management/configuration/ansible.cfg"
                },
           }
        }
    },
    build: {
        configure: {
            params: { stage: "dev", app_name: "test", commit_id: "29hu9efwhn89esfh90dhrsvh80h30h80", provider: "aws"},
            header: {},
            query: {},
            body: {
                STRONGHOLD_tf_init: true,
                STRONGHOLD_cfg_exec: "ansible-playbook",
                STRONGHOLD_cfg_command: ["-i", "/var/idam/libs/pyModules/terraform.py", "ping/federate/master.yml"],
                STRONGHOLD_cfg_cwd: "/var/idam/identity-management/configuration/playbooks",
                envVars: {
                    ANSIBLE_TF_BIN: "/var/idam/infrastructure/exec/terraform",
                    ANSIBLE_TF_DIR: "/var/idam/identity-management/orchestration/identity-management",
                    ANSIBLE_TF_WS_NAME: "dev-06df57d131a97cb145edb4ea00b57eaa039edf4a",
                    ANSIBLE_LIBRARY: "/var/idam/libs/configuration/modules/",
                    ANSIBLE_VAULT_PASSWORD_FILE: "/var/idam/infrastructure/keys/vault-password-file",
                    ANSIBLE_SSH_RETRIES: 5,
                    ANSIBLE_DEBUG: 1,
                    ANSIBLE_HOST_KEY_CHECKING: false,
                    ANSIBLE_CONFIG: "/var/idam/identity-management/configuration/ansible.cfg"
                },
           }
        }
    },
    validCheckoutData: {
        callback_url: "https://gitlab.bootstrap.atoshcp.net/idam/idam/pipelines/#3659",
        callback_pipeline_id: "3659",
        callback_project_id: "21",
        callback_ci_type: "gitlab",
        app_name: "",
        infra_base_path: "/var/idam-test-clone",
        git_branch: "master",
        git_url: "git@gitlab.bootstrap.atoshcp.net:idam/idam.git"
    },
    invalidCheckoutData: {
        callback_url: "https://gitlab.bootstrap.atoshcp.net/idam/idam/pipelines/#3659",
        callback_pipeline_id: "3659",
        callback_project_id: "21",
        callback_ci_type: "gitlab",
        app_name: "",
        infra_base_path: "/var/idam-test-clone",
        git_branch: "master",
        git_url: "git@gitlab.fake.example.net:idam/idam.git"
    },
    validProvisionData: {
        callback_url: "https://gitlab.fake.example.net/idam/idam/pipelines/3659",
        callback_next: "fake",
        callback_pipeline_id: "3659",
        callback_project_id: "21",
        callback_ci_type: "gitlab",
        STRONGHOLD_tf_workspace: "dev-master",
        STRONGHOLD_orc_exec: "/var/idam/infrastructure/exec/terraform",
        STRONGHOLD_orc_cwd: "/var/idam-test-clone/95c7dfebcd98122407d77237235aa2707ef03917/group-directory/orchestration/aws",
        envVars: {
            TF_VAR_instance_count: "1",
            TF_VAR_clean_up: "1",
            TF_VAR_binary_location: "group-directory-master/95c7dfebcd98122407d77237235aa2707ef03917/seeder.jar",
            TF_VAR_stage: "dev",
            TF_VAR_name: "group-directory",
            TF_VAR_app_name: "group-directory",
            TF_VAR_revision_id: "95c7dfebcd98122407d77237235aa2707ef03917",
            TF_VAR_dns_record_name: "gd-master",
            TF_VAR_branch_name: "master"
        }
    },
    invalidProvisionData: {
        callback_url: "https://gitlab.bootstrap.atoshcp.net/idam/idam/pipelines/3659",
        callback_next: "gd:dev:aws:configure",
        callback_pipeline_id: "3659",
        callback_project_id: "21",
        callback_ci_type: "gitlab",
        STRONGHOLD_tf_workspace: "dev-master",
        STRONGHOLD_orc_exec: "__terraform",
        STRONGHOLD_orc_cwd: "/var/idam-test-clone/95c7dfebcd98122407d77237235aa2707ef03917/group-directory/orchestration/aws",
        envVars: {
            TF_VAR_instance_count: "1",
            TF_VAR_clean_up: "1",
            TF_VAR_binary_location: "group-directory-master/95c7dfebcd98122407d77237235aa2707ef03917/seeder.jar",
            TF_VAR_stage: "dev",
            TF_VAR_name: "group-directory",
            TF_VAR_app_name: "group-directory",
            TF_VAR_revision_id: "95c7dfebcd98122407d77237235aa2707ef03917",
            TF_VAR_dns_record_name: "gd-master",
            TF_VAR_branch_name: "master"
        }
    },
     validConfigData: {
        callback_url: "https://gitlab.bootstrap.atoshcp.net/idam/idam/pipelines/3659",
        callback_next: "fake",
        callback_pipeline_id: "3659",
        callback_project_id: "21",
        callback_ci_type: "gitlab",
        STRONGHOLD_tf_init: false,
        STRONGHOLD_cfg_cwd: "/var/idam-test-clone/95c7dfebcd98122407d77237235aa2707ef03917/group-directory/configuration/playbooks",
        STRONGHOLD_cfg_command: ["-i", "/var/idam-test-clone/95c7dfebcd98122407d77237235aa2707ef03917/libs/pyModules/terraform.py", "ping/directory/master.yml"],
        STRONGHOLD_cfg_exec: "ansible-playbook",
        // STRONGHOLD_cfg_exec: "/bin/echo",
        envVars: {
            ANSIBLE_TF_WS_NAME: "dev-master",
            ANSIBLE_LIBRARY: "/var/idam-test-clone/95c7dfebcd98122407d77237235aa2707ef03917/libs/configuration/modules/",
            ANSIBLE_TF_BIN: "/var/idam/infrastructure/exec/terraform",
            ANSIBLE_TF_DIR: "/var/idam-test-clone/95c7dfebcd98122407d77237235aa2707ef03917/group-directory/orchestration/aws",
            ANSIBLE_DEBUG: 0,
            ANSIBLE_HOST_KEY_CHECKING: false,
            ANSIBLE_CONFIG: "/var/idam-test-clone/95c7dfebcd98122407d77237235aa2707ef03917/group-directory/configuration/ansible.cfg",
            ANSIBLE_VAULT_PASSWORD_FILE: "/var/idam/infrastructure/keys/vault-password-file",
            ANSIBLE_SSH_RETRIES: 5
        }
    },
    invalidConfigData: {
        callback_url: "https://gitlab.bootstrap.atoshcp.net/idam/idam/pipelines/3659",
        callback_next: "fake",
        callback_pipeline_id: "3659",
        callback_project_id: "21",
        callback_ci_type: "gitlab",
        STRONGHOLD_tf_init: true,
        STRONGHOLD_cfg_cwd: "/var/idam-test-clone/95c7dfebcd98122407d77237235aa2707ef03917/group-directory/configuration/playbooks",
        STRONGHOLD_cfg_command: ["-i", "/var/idam-test-clone/95c7dfebcd98122407d77237235aa2707ef03917/libs/pyModules/terraform.py", "ping/directory/master.yml"],
        STRONGHOLD_cfg_exec: "ansible-playbook",
        envVars: {
            ANSIBLE_TF_WS_NAME: "dev-master",
            ANSIBLE_LIBRARY: "/var/idam-test-clone/95c7dfebcd98122407d77237235aa2707ef03917/libs/configuration/modules/",
            ANSIBLE_TF_BIN: "/var/idam/infrastructure/exec/terraform",
            ANSIBLE_TF_DIR: "/var/idam-test-clone/95c7dfebcd98122407d77237235aa2707ef03917/group-directory/orchestration/aws",
            ANSIBLE_DEBUG: 0,
            ANSIBLE_HOST_KEY_CHECKING: false,
            ANSIBLE_CONFIG: "/var/idam-test-clone/95c7dfebcd98122407d77237235aa2707ef03917/group-directory/configuration/ansible.cfg",
            ANSIBLE_VAULT_PASSWORD_FILE: "/var/idam/infrastructure/keys/vault-password-file",
            ANSIBLE_SSH_RETRIES: 5
        }
    },
    validPlaybookData: {
        STRONGHOLD_tf_init: false,
        STRONGHOLD_cfg_command: ["all", "-i", "localhost,", "-c", "local", "-m", "shell", "-a", "'echo hello world'"],
        STRONGHOLD_cfg_exec: "ansible",
        envVars: {
            ANSIBLE_TF_BIN: "terraform",
            ANSIBLE_TF_DIR: __dirname,
        }
    },
    invalidPlaybookData: {
        callback: true,
        callback_url: "https://gitlab.fake.example.net/idam/idam/pipelines/3659",
        callback_next: "fake_job",
        callback_pipeline_id: "3659",
        callback_project_id: "21",
        callback_ci_type: "gitlab",
        STRONGHOLD_tf_init: false,
        STRONGHOLD_cfg_command: ["all", "-i", "localhost,", "-c", "local", "-m", "shell", "-a", "'echo hello world'"],
        STRONGHOLD_cfg_exec: "__ansible",
        envVars: {
            ANSIBLE_TF_BIN: "terraform",
            ANSIBLE_TF_DIR: __dirname,
        }
    },
    commandRunner: {
        valid_command: "echo",
        err_command:"foo_bar",
        args: ["$TEST"],
        options: {
            cwd: "/bin",
            detached: true,
            env: {
                TEST: "Hello Test World"
            },
            shell: true
        },
        logOptions: {
            logGroup: '/myorg/sharedservices/app1/aws',
            logStream: 'dev-provision-create',
            correlation_id: '219712y382378523523-234324234-23-932423-3232'
        }
    },
    notifyBuildToolInvalid: {
        callback_url: "https://some.pipeline.net/",
        callback_next: "test_dev",
        callback_pipeline_id: "2029--",
        callback_project_id: "21--",
        callback_ci_type: "gitlab",
    },
    // notifyBuildToolValid: {
    //     callback_url: "https://some.pipeline.net/",
    //     callback_next: "test_dev",
    //     callback_pipeline_id: "2029",
    //     callback_project_id: "21",
    //     callback_ci_type: "gitlab",
    // }
}

module.exports = Config;
