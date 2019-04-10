GitLab
===

WIP

FIXME: COPY AND PASTE from reference Project - ADJUST THIS

```
.component:provision:only: &component-provision-only
  only:
    changes:
      - component-x/business/seeder/**/*
      - component-x/orchestration/aws/**/*

.component:configure:only: &component-configure-only
  only:
    changes:
      - component-x/business/seeder/**/*
      - component-x/orchestration/aws/**/*
      - component-x/configuration/playbooks/ping/directory/master.yml
      - component-x/configuration/roles/domain.el7-ping_directory/**/*

.component:seed:only: &component-seed-only
  only:
    changes:
      - component-x/business/seeder/**/*
      - component-x/orchestration/aws/**/*
      - component-x/configuration/playbooks/ping/directory/master.yml
      - component-x/configuration/roles/domain.el7-ping_directory/**/*
      - component-x/configuration/playbooks/ping/directory/myorg-pingdirectory.yml
      - component-x/configuration/roles/domain.myorg-pingdirectory/**/*

.publish-tests: &component-publish-tests
  stage: publish-tests
  variables:
    GIT_STRATEGY: fetch
  image: python:3.7.0-alpine
  script:
    - pip install awscli
    - |
      for EXT in html css js; do
        aws s3 cp \
          "${TEST_PATH}/build/reports/tests/" \
          s3://${ARTIFACT_BUCKET}/reports/${STAGE}/${CI_COMMIT_REF_SLUG}/${COMPONENT}/ \
          --storage-class ONEZONE_IA \
          --acl public-read \
          --content-type "text/${EXT}" \
          --exclude "*" \
          --include "*.${EXT}" \
          --recursive
      done

.component-global: &component-global
  extends: .except-global
  variables:
    COMPONENT: component-x
    ORCHESTRATION: $COMPONENT/orchestration/aws
    CONFIGURATION: $COMPONENT/configuration
    ARTIFACT_NAME: seeder
    ARTIFACT_PATH: $COMPONENT/business/$ARTIFACT_NAME/build/libs
    ARTIFACT_BUILD: $CI_PROJECT_DIR/$ARTIFACT_PATH/$ARTIFACT_NAME.jar
    ARTIFACT_REPO_PATH: $COMPONENT-$CI_COMMIT_REF_SLUG/$CI_COMMIT_SHA/$ARTIFACT_NAME.jar
    TEST_PATH: ${COMPONENT}/tests
    TEST_GROUP: com.domain.myorg.groupdirectory
    TEST_CLASS: PingDirectorySmokeTests
    TEST_CATEGORY: PingDirectorySmoke
    DNS_RECORD_NAME: $COMPONENT
    INSTANCE_COUNT: 3
    ANSIBLE_LIBRARY: ${INFRA_BASE_PATH}/${CI_COMMIT_SHA}/libs/configuration/modules/
    STRONGHOLD_TF_WORKSPACE: ${STAGE}-${CI_COMMIT_REF_SLUG}
    DO_CLEAN_UP: 0
    PLAYBOOK: master.yml
  only:
    refs:
      - master
      - merge_requests
    changes:
      - component-x/**/*

.component-dev: &component-dev
  extends: .component-global
  variables:
    STAGE: dev
    INSTANCE_COUNT: 1
    DO_CLEAN_UP: 1
    DNS_RECORD_NAME: component-${CI_COMMIT_REF_SLUG}
    GIT_STRATEGY: none
  except:
    refs:
      - /^demo\/.*$/
      - schedules
      - tags
    variables:
      - $CI_COMMIT_MESSAGE =~ /skip-component/
      - $RUN

.component-dev-aws: &component-dev-aws
  extends: .component-dev
  variables:
    PROVIDER: aws
  stage: dev-aws

.component-aat: &component-aat
  extends: .component-global
  variables:
    STAGE: aat
    DO_CLEAN_UP: 1
    GIT_STRATEGY: none
  only:
    refs:
      - master

.component-aat-aws: &component-aat-aws
  extends: .component-aat
  variables:
    PROVIDER: aws
  stage: aat-aws

.component-uat: &component-uat
  extends: .component-global
  variables:
    STAGE: uat
    GIT_STRATEGY: none
  only:
    refs:
      - master
      - /^demo\/.*$/

.component-uat-aws: &component-uat-aws
  extends: .component-uat
  variables:
    PROVIDER: aws
  stage: uat-aws

.component-test: &component-test
  image: gradle:4.8.1-jdk
  variables:
    GIT_STRATEGY: fetch
  when: manual
  allow_failure: false
  artifacts:
    name: component:${STAGE}:${PROVIDER}:test:${CI_COMMIT_REF_SLUG}
    when: always
    paths:
      - ${TEST_PATH}/build/reports/tests
    reports:
      junit: ${TEST_PATH}/build/test-results/${PROVIDER}${TEST_CATEGORY}/TEST-${TEST_GROUP}.smoketests.${TEST_CLASS}.xml

.stop-component-test: &stop-component-test
  stage: publish-tests
  script:
    - echo "Remove test environments."
  when: manual
  environment:
    name: ${CI_COMMIT_REF_SLUG}/${STAGE}-${PROVIDER}-${COMPONENT}-tests
    action: stop

.component-smoke-test:
  script:
    - &component-smoke-test |
      gradle --version
      cd $TEST_PATH
      gradle test

.stronghold-dependencies: &stronghold-dependencies
  before_script:
    - set -x
    - which curl || apk add --update curl
    - |
      generate_aws_provision_data_v2() {
      cat <<EOF
      {
          "callback_url": "${CI_PIPELINE_URL}",
          "callback_next": "${NEXT_JOB}",
          "callback_pipeline_id": "${CI_PIPELINE_ID}",
          "callback_project_id": "${CI_PROJECT_ID}",
          "callback_ci_type": "gitlab",
          "STRONGHOLD_tf_workspace": "${STRONGHOLD_TF_WORKSPACE}",
          "STRONGHOLD_orc_exec": "/var/idam/infrastructure/exec/terraform",
          "STRONGHOLD_orc_cwd": "${INFRA_BASE_PATH}/${CI_COMMIT_SHA}/${COMPONENT}/orchestration/${PROVIDER}",
          "envVars": {
              "TF_CLI_ARGS": "-var-file=../../../config/idam_variables.tfvars -var \"stage=${STAGE}\" -var \"branch_name=${CI_COMMIT_REF_SLUG}\" -var \"revision_id=${CI_COMMIT_SHA}\"",
              "TF_VAR_name": "${COMPONENT}",
              "TF_VAR_dns_record_name": "${DNS_RECORD_NAME}",
              "TF_VAR_binary_location": "${CI_COMMIT_REF_SLUG}/latest/${ARTIFACT_NAME}.jar",
              "TF_VAR_instance_count": "${INSTANCE_COUNT}",
              "TF_VAR_clean_up": "${DO_CLEAN_UP}"
          }
      }
      EOF
      }
      generate_azure_provision_data_v2() {
      cat <<EOF
      {
          "callback_url": "${CI_PIPELINE_URL}",
          "callback_next": "${NEXT_JOB}",
          "callback_pipeline_id": "${CI_PIPELINE_ID}",
          "callback_project_id": "${CI_PROJECT_ID}",
          "callback_ci_type": "gitlab",
          "STRONGHOLD_tf_workspace": "${STRONGHOLD_TF_WORKSPACE}",
          "STRONGHOLD_tf_args": ["-var-file=../../../config/idam_variables.tfvars", "-var=\"stage=${STAGE\""}],
          "STRONGHOLD_orc_exec": "/var/idam/infrastructure/exec/terraform",
          "STRONGHOLD_orc_cwd": "${INFRA_BASE_PATH}/${CI_COMMIT_SHA}/${COMPONENT}/orchestration/${PROVIDER}",
          "envVars": {
              "TF_VAR_instance_count": "${INSTANCE_COUNT}",
              "TF_VAR_clean_up": "${DO_CLEAN_UP}",
              "TF_VAR_binary_location": "${CI_COMMIT_REF_SLUG}/latest/${ARTIFACT_NAME}.jar",
              "TF_VAR_stage": "${STAGE}",
              "TF_VAR_name": "${COMPONENT}",
              "TF_VAR_branch_name": "${CI_COMMIT_REF_SLUG}",
              "TF_VAR_app_name": "${COMPONENT}",
              "TF_VAR_revision_id": "${CI_COMMIT_SHA}",
              "TF_VAR_dns_record_name": "${DNS_RECORD_NAME}",
              "TF_VAR_tenant_id": "${DEV_AZURE_TENANT_ID}",
              "TF_VAR_subscription_id": "${DEV_AZURE_SUBSCRIPTION_ID}",
              "TF_VAR_client_id": "${DEV_AZURE_CLIENT_ID}",
              "TF_VAR_client_secret": "${DEV_AZURE_CLIENT_SECRET}",
              "TF_VAR_location": "${AZURE_LOCATION}"
          }
      }
      EOF
      }
      generate_configure_data_v2() {
      cat <<EOF
      {
          "callback_url": "${CI_PIPELINE_URL}",
          "callback_next": "${NEXT_JOB}",
          "callback_pipeline_id": "${CI_PIPELINE_ID}",
          "callback_project_id": "${CI_PROJECT_ID}",
          "callback_ci_type": "gitlab",
          "STRONGHOLD_tf_init": true,
          "STRONGHOLD_cfg_cwd": "${INFRA_BASE_PATH}/${CI_COMMIT_SHA}/${COMPONENT}/configuration/playbooks",
          "STRONGHOLD_cfg_command": ["-i", "${INFRA_BASE_PATH}/${CI_COMMIT_SHA}/${ANSIBLE_INVENTORY}", "ping/directory/${PLAYBOOK}"],
          "STRONGHOLD_cfg_exec": "ansible-playbook",
          "envVars": {
              "ANSIBLE_TF_WS_NAME": "${STRONGHOLD_TF_WORKSPACE}",
              "ANSIBLE_LIBRARY": "${ANSIBLE_LIBRARY}",
              "ANSIBLE_TF_BIN": "${TERRAFORM_EXEC_PATH}",
              "ANSIBLE_TF_DIR": "${INFRA_BASE_PATH}/${CI_COMMIT_SHA}/${COMPONENT}/orchestration/${PROVIDER}",
              "ANSIBLE_DEBUG": 0,
              "ANSIBLE_HOST_KEY_CHECKING": false,
              "ANSIBLE_CONFIG": "${INFRA_BASE_PATH}/${CI_COMMIT_SHA}/${COMPONENT}/configuration/ansible.cfg",
              "ANSIBLE_VAULT_PASSWORD_FILE": "/var/idam/infrastructure/keys/vault-password-file",
              "ANSIBLE_SSH_RETRIES": 5
          }
      }
      EOF
      }

.component:kitchen:
  <<: *component-global
  <<: *terraform
  <<: *kitchen-terraform-test
  stage: test
  cache:
    key: "kitchen-$CI_COMMIT_REF_SLUG"
    paths:
      - $ORCHESTRATION/.kitchen

component:tf:validate:
  <<: *component-global
  <<: *terraform
  stage: validate
  script:
    - terraform validate -var-file ../../../config/idam_variables.tfvars -var "revision_id=${CI_COMMIT_SHA}" -var "branch_name=${CI_COMMIT_REF_SLUG}"
    - terraform plan -out=$PLAN -var-file ../../../config/idam_variables.tfvars -var "revision_id=${CI_COMMIT_SHA}" -var "branch_name=${CI_COMMIT_REF_SLUG}"
  artifacts:
    name: plan
    paths:
      - $ORCHESTRATION/$PLAN

stop:component:dev:aws:
  extends: .component-dev-aws
  <<: *stronghold-dependencies
  script:
    - |
      curl -i -X DELETE \
        -H 'Content-Type:application/json' \
        -d "$(generate_aws_provision_data_v2)" \
        ${STRONGHOLD_URL}/build/v2/pipeline/destroy/${STAGE}/${COMPONENT}/${CI_COMMIT_SHA}/${PROVIDER}
  when: manual
  environment:
    name: ${CI_COMMIT_REF_SLUG}/${STAGE}-${PROVIDER}-${COMPONENT}
    action: stop
  <<: *component-seed-only

stop:component:dev:aws:test:
  extends: .component-dev-aws
  <<: *stop-component-test
  <<: *component-configure-only

stop:component:aat:aws:test:
  extends: .component-aat-aws
  <<: *stop-component-test
  <<: *component-configure-only

stop:component:uat:aws:test:
  extends: .component-uat-aws
  <<: *stop-component-test
  <<: *component-configure-only

component:dev:aws:provision:
  extends: .component-dev-aws
  <<: *stronghold-dependencies
  script:
    - export NEXT_JOB='component:dev:aws:configure'
    - echo ${CI_ENVIRONMENT_URL} > component-${STAGE}-${PROVIDER}-environment.txt
    - |
      curl -i -X POST \
        -H 'Content-Type:application/json' \
        -d "$(generate_aws_provision_data_v2)" \
        ${STRONGHOLD_URL}/build/v2/pipeline/provision/${STAGE}/${COMPONENT}/${CI_COMMIT_SHA}/${PROVIDER}
  artifacts:
    name: $CI_JOB_NAME:$CI_COMMIT_REF_SLUG
    paths:
      - component-${STAGE}-${PROVIDER}-environment.txt
  <<: *component-provision-only

component:dev:aws:configure:
  extends: .component-dev-aws
  <<: *stronghold-dependencies
  script:
    - export NEXT_JOB='component:dev:aws:seed'
    - |
      curl -i -X POST \
        -H 'Content-Type:application/json' \
        -d "$(generate_configure_data_v2)" \
        ${STRONGHOLD_URL}/build/v2/pipeline/configure/${STAGE}/${COMPONENT}/${CI_COMMIT_SHA}/${PROVIDER}
  when: manual
  allow_failure: false
  <<: *component-configure-only


component:dev:aws:seed:
  extends: .component-dev-aws
  <<: *stronghold-dependencies
  script:
    - export NEXT_JOB='component:dev:aws:test'
    - export PLAYBOOK='myorg-pingdirectory.yml'
    - |
      curl -i -X POST \
        -H 'Content-Type:application/json' \
        -d "$(generate_configure_data_v2)" \
        ${STRONGHOLD_URL}/build/v2/pipeline/configure/${STAGE}/${COMPONENT}/${CI_COMMIT_SHA}/${PROVIDER}
  when: manual
  allow_failure: false
  <<: *component-seed-only


component:dev:aws:test:
  extends: .component-dev-aws
  <<: *component-test
  script:
    - *component-smoke-test
  environment:
    name: ${CI_COMMIT_REF_SLUG}/${STAGE}-${PROVIDER}-${COMPONENT}
    url: https://component-${CI_COMMIT_REF_SLUG}.${STAGE}.${DNS_NAMESPACE}-${PROVIDER}.${DNS_ZONE}/console/login
    on_stop: stop:component:dev:aws
  <<: *component-seed-only


component:dev:tests:publish:
  extends: .component-dev-aws
  <<: *component-publish-tests
  dependencies:
    - component:dev:aws:test
  environment:
    name: ${CI_COMMIT_REF_SLUG}/${STAGE}-${PROVIDER}-${COMPONENT}-tests
    url: https://${ARTIFACT_BUCKET}.s3.amazonaws.com/reports/${STAGE}/${CI_COMMIT_REF_SLUG}/${COMPONENT}/${PROVIDER}${TEST_CATEGORY}/classes/${TEST_GROUP}.smoketests.${TEST_CLASS}.html
    on_stop: stop:component:dev:aws:test
  <<: *component-seed-only

#
# AWS - AAT
#
stop:component:aat:aws:
  extends: .component-aat-aws
  <<: *stronghold-dependencies
  script:
    - |
      curl -i -X DELETE \
        -H 'Content-Type:application/json' \
        -d "$(generate_aws_provision_data_v2)" \
        ${STRONGHOLD_URL}/build/v2/pipeline/destroy/${STAGE}/${COMPONENT}/${CI_COMMIT_SHA}/${PROVIDER}
  when: manual
  environment:
    name: ${CI_COMMIT_REF_SLUG}/${STAGE}-${PROVIDER}-${COMPONENT}
    action: stop
  <<: *component-provision-only

component:aat:aws:provision:
  extends: .component-aat-aws
  <<: *stronghold-dependencies
  script:
    - export NEXT_JOB='component:aat:aws:configure'
    - echo ${CI_ENVIRONMENT_URL} > component-${STAGE}-${PROVIDER}-environment.txt
    - |
      curl -i -X POST \
        -H 'Content-Type:application/json' \
        -d "$(generate_aws_provision_data_v2)" \
        ${STRONGHOLD_URL}/build/v2/pipeline/provision/${STAGE}/${COMPONENT}/${CI_COMMIT_SHA}/${PROVIDER}
  artifacts:
    name: component:aat:aws:provision:$CI_COMMIT_REF_SLUG
    paths:
      - component-${STAGE}-${PROVIDER}-environment.txt
  <<: *component-provision-only

component:aat:aws:configure:
  extends: .component-aat-aws
  <<: *stronghold-dependencies
  script:
    - export NEXT_JOB='component:aat:aws:seed'
    - |
      curl -i -X POST \
        -H 'Content-Type:application/json' \
        -d "$(generate_configure_data_v2)" \
        ${STRONGHOLD_URL}/build/v2/pipeline/configure/${STAGE}/${COMPONENT}/${CI_COMMIT_SHA}/${PROVIDER}
  when: manual
  allow_failure: false
  <<: *component-configure-only

component:aat:aws:seed:
  extends: .component-aat-aws
  <<: *stronghold-dependencies
  script:
    - export NEXT_JOB='component:aat:aws:test'
    - export PLAYBOOK='myorg-pingdirectory.yml'
    - |
      curl -i -X POST \
        -H 'Content-Type:application/json' \
        -d "$(generate_configure_data_v2)" \
        ${STRONGHOLD_URL}/build/v2/pipeline/configure/${STAGE}/${COMPONENT}/${CI_COMMIT_SHA}/${PROVIDER}
  when: manual
  allow_failure: false
  <<: *component-seed-only

component:aat:aws:test:
  extends: .component-aat-aws
  <<: *component-test
  script:
    - *component-smoke-test
  environment:
    name: ${CI_COMMIT_REF_SLUG}/${STAGE}-${PROVIDER}-${COMPONENT}
    url: https://${COMPONENT}.${STAGE}.${DNS_NAMESPACE}-${PROVIDER}.${DNS_ZONE}/console/login
    on_stop: stop:component:aat:aws
  <<: *component-seed-only

component:aat:tests:publish:
  extends: .component-aat-aws
  <<: *component-publish-tests
  dependencies:
    - component:aat:aws:test
  environment:
    name: ${CI_COMMIT_REF_SLUG}/${STAGE}-${PROVIDER}-${COMPONENT}-tests
    url: https://${ARTIFACT_BUCKET}.s3.amazonaws.com/reports/${STAGE}/${CI_COMMIT_REF_SLUG}/${COMPONENT}/${PROVIDER}${TEST_CATEGORY}/classes/${TEST_GROUP}.smoketests.${TEST_CLASS}.html
    on_stop: stop:component:aat:aws:test
  <<: *component-seed-only
```
