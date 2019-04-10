Jenkins
===

WIP

FIXME: COPY AND PASTE from reference Project - ADJUST THIS

```
pipeline {
    agent any

    parameters {
      string(name: 'APP_NAME', defaultValue: 'group-directory', description: 'Component Name')
      string(name: 'EXTENSION_MODULE', defaultValue: 'seeder', description: 'Extension module name to be pacakged and tested')
      string(name: 'CLUSTER_COUNT', defaultValue: '1', description: 'Cluster count of instances')
      string(name: 'REMOTE_PIPELINE_URL', defaultValue: '', description: 'Stronghold URL')
      string(name: 'BASE_URL', defaultValue: '', description: '_self URL')
      string(name: 'BASE_DOMAIN', defaultValue: 'myorg-aws.clients.domain.com', description: 'products base domain')
      string(name: 'BASE_DOMAIN_INTERNAL', defaultValue: 'myorg-aws.clients.domain.internal', description: 'products base domain internal')
      string(name: 'SONARQUBE_URL', defaultValue: '', description: 'Static Analysis URL')
      string(name: 'TERRAFORM_EXEC_PATH', defaultValue: '/var/idam/infrastructure/exec/terraform', description: 'Exec Path  Terraform')
      string(name: 'INFRA_BASE_PATH', defaultValue: '/var/idam-test-clone', description: 'Base Path for monorepo on remote workers')
      string(name: 'GITLAB_POINTER', defaultValue: 'git@gitlab.bootstrap.atoshcp.net:idam/idam.git', description: 'Component Name')
      choice(name: 'DATA_CENTER', choices: 'aws\nazure\nopen_stack', description: 'available Accounts to deploy in')
      string(name: 'ARTEFACT_BUCKET', defaultValue: '', description: 'S3 bucket used for artefact storage.')
      booleanParam(name: 'KEEP_DEV', defaultValue: false, description: 'set to true for skipping Dev destruction')
    }
    environment {
        STAGE = "dev"
        BRANCH = "${GIT_BRANCH.split('/').last()}"
        DNS_MASTER = "${APP_NAME}"
        DNS_DEV = "${APP_NAME}-${GIT_COMMIT}"
        DESTROY_DEV = "${BRANCH == 'master' ? false : params.KEEP_DEV == false ? true : false}"
        BASE_DOMAIN_DATA_CENTER = "myorg-${DATA_CENTER}.clients.domain.com"
        // BASE_DOMAIN_AZURE_LOCAL = "myorg-${DATA_CENTER}.clients.domain.local"
    }
    // CI
    stages {
        stage('CI - Build Domain') {
            environment {
                SONARQUBE_LOGIN = "db99b34a7f59cdbddc0906ce4ea24a48a17c8c3b"
            }
            steps {
                sh 'echo "Build Seeder App and Run Analysis"'
                sh "cd $WORKSPACE/${APP_NAME}/business/${EXTENSION_MODULE}; ./gradlew build sonarqube -Dsonar.host.url=${SONARQUBE_URL} -Dsonar.login=${SONARQUBE_LOGIN}"
              //  sh "cd $WORKSPACE/${APP_NAME}/business/${EXTENSION_MODULE}; ./gradlew build"
            }
        }

        stage('CI - Publish') {
            environment {
              BUILD_ARTIFACT = "${EXTENSION_MODULE}.jar"
              BUILD_DIR = "${EXTENSION_MODULE}/build/libs"
              INFRA_BASE_PATH = "$WORKSPACE"
            }
            steps {
                echo 'Publishing to S3...' // pre-requisite on control plane
                  sh """\
                    cd $WORKSPACE/libs/pyModules
                    chmod +x upload.py
                    ./upload.py \"$WORKSPACE/${APP_NAME}/business/${BUILD_DIR}/${BUILD_ARTIFACT}\" \"${env.JOB_NAME}/$GIT_COMMIT/${BUILD_ARTIFACT}\" \"${env.STAGE}\" \"${ARTEFACT_BUCKET}\"
                """.stripIndent()
                // sh "cd $WORKSPACE/libs/pyModules; chmod +x upload.py; ./upload.py \"$WORKSPACE/${APP_NAME}/business/${BUILD_DIR}/${BUILD_ARTIFACT}\" \"${env.JOB_NAME}/$GIT_COMMIT/${BUILD_ARTIFACT}\" \"${env.STAGE}\""
            }
        }
        stage('SHA Checkout Component') {
            environment {
                STEP_ID = "GitSHACheckout"
                INFRA_BASE_PATH = "/var/idam-test-clone"
            }
            steps {
                sh """\
                curl -X POST -H "Content-Type: application/json" \
                -d '{\"callback_url\": \"${BASE_URL}/job/${env.JOB_NAME}/${env.BUILD_ID}/input/${env.STEP_ID}/submit\", \"app_name\": \"${APP_NAME}\", \"git_branch\": \"$GIT_BRANCH\", \"git_url\":\"$GITLAB_POINTER\", \"infra_base_path\": \"${INFRA_BASE_PATH}\" }' \
                ${REMOTE_PIPELINE_URL}/build/v1/pipeline/checkout/$GIT_COMMIT
                """.stripIndent()
                input id: "${env.STEP_ID}", message: "Waiting For Stronghold to Git Prep"
            }
        }
        // DEV
        stage('Dev Provisioning') {
            environment {
                STEP_ID = "RunDevProvisioning"
                AZURE_SUBSCRIPTION_ID = credentials("${env.STAGE}_subscription_id")
                AZURE_CLIENT_ID = credentials("${env.STAGE}_client_id")
                AZURE_CLIENT_SECRET = credentials("${env.STAGE}_client_secret")
            }
            steps {
                echo 'Running Provisioning Remotely'
                sh """\
                curl -X POST -H "Content-Type: application/json" \
                -d '{\"callback_url\": \"${BASE_URL}/job/${env.JOB_NAME}/${env.BUILD_ID}/input/${env.STEP_ID}/submit\", \
                \"app_name\": \"${APP_NAME}\", \"infra_base_path\": \"${INFRA_BASE_PATH}/$GIT_COMMIT\",  \"orc_name\":\"${DATA_CENTER}\", \"execCommand\": \"${env.TERRAFORM_EXEC_PATH}\", \
                \"envVars\": { \"TF_VAR_instance_count\": \"$CLUSTER_COUNT\", \"TF_VAR_binary_location\": \"${env.JOB_NAME}/$GIT_COMMIT/${EXTENSION_MODULE}.jar\", \"TF_VAR_stage\": \"${env.STAGE}\", \"TF_VAR_name\": \"${APP_NAME}\", \
                \"TF_VAR_branch_name\": \"${BRANCH}\", \"TF_VAR_revision_id\": \"$GIT_COMMIT\",  \"TF_VAR_dns_record_name\": \"${BRANCH == 'master' ? DNS_MASTER : DNS_DEV}\", \
                \"TF_VAR_tenant_id\": \"e9fdb35b-9e62-42fd-8383-92522f5e27df\", \
                \"TF_VAR_subscription_id\": \"${env.AZURE_SUBSCRIPTION_ID}\", \
                \"TF_VAR_client_id\": \"${env.AZURE_CLIENT_ID}\", \
                \"TF_VAR_client_secret\": \"${env.AZURE_CLIENT_SECRET}\", \
                \"TF_VAR_location\": \"westeurope\" }}' \
                ${REMOTE_PIPELINE_URL}/build/v1/pipeline/provision/${env.STAGE}/${APP_NAME}/$GIT_COMMIT
                """.stripIndent()
                input id: "${env.STEP_ID}", message: "Waiting For Stronghold to Deploy Stuff"
            }
        }
        stage('Dev Configuration') {
            environment {
              STEP_ID = "RunDevConfiguration"
              ANSIBLE_PLAYBOOK = "ping/directory/master.yml"
              ORC_NAME = "group-directory"
            }
            steps {
                echo 'Running Configuration Remotely'
                sh """\
                curl -X POST -H "Content-Type: application/json" \
                -d '{\"callback_url\": \"${BASE_URL}/job/${env.JOB_NAME}/${env.BUILD_ID}/input/${env.STEP_ID}/submit\", \"app_name\": \"${APP_NAME}\", \"infra_base_path\": \"${INFRA_BASE_PATH}/$GIT_COMMIT\", \"orc_name\":\"${DATA_CENTER}\", \
                \"playbook\": \"${env.ANSIBLE_PLAYBOOK}\", \"execCommand\": \"${TERRAFORM_EXEC_PATH}\", \
                \"envVars\": { \"ANSIBLE_TF_WS_NAME\": \"${env.STAGE}-$GIT_COMMIT\" }}' \
                ${REMOTE_PIPELINE_URL}/build/v1/pipeline/configure/${env.STAGE}/${APP_NAME}/$GIT_COMMIT
                """.stripIndent()
                input id: "${env.STEP_ID}", message: "Waiting For Stronghold to Configure Stuff"
            }
        }
        stage('Component Tests') {
            environment {
              STEP_ID = "ComponentTestsAndEnvDestroy"
            }
          steps {
              echo 'Running Component ONLY Tests from integrationtests project'
              sh """\
                  cd $WORKSPACE/group-directory/tests && ./gradlew clean
              """.stripIndent()
              retry(2) {
                  sh """\
                      cd $WORKSPACE/group-directory/tests && ./gradlew pingDirectorySmoke -Dpingconfig.pingDirectoryBaseUrl=https://${BRANCH == 'master' ? DNS_MASTER : DNS_DEV}.${STAGE}.${BASE_DOMAIN_DATA_CENTER} -i
                      sleep 10
                  """.stripIndent()
              }
            }
            post {
                always {
                  echo 'Uploading Component Reports'
                  sh """\
                      cd $WORKSPACE/libs/pyModules
                      chmod +x uploadDirS3.py
                      ./uploadDirS3.py \"$WORKSPACE/qa/build/reports/tests\" \"${ARTEFACT_BUCKET}\" \"reports/${env.JOB_NAME}\" \"${env.BUILD_ID}\"
                  """.stripIndent()
                }
                success {
                  echo 'Promoting to AAT'
                }
            }
        }
        stage ('Delete Dev Infra') {
            when {
              expression {
                  env.DESTROY_DEV == true
              }
            }
            environment {
              STEP_ID = "ComponentTestsAndEnvDestroy"
            }
            steps {
              echo 'Running Dev Destruction Remotely'
              sh """\
              curl -X DELETE -H "Content-Type: application/json" \
              -d '{\"callback_url\": \"${BASE_URL}/job/${env.JOB_NAME}/${env.BUILD_ID}/input/${env.STEP_ID}/submit\", \
              \"app_name\": \"${APP_NAME}\", \"infra_base_path\": \"${INFRA_BASE_PATH}/$GIT_COMMIT\",  \"orc_name\":\"${DATA_CENTER}\", \"execCommand\": \"${env.TERRAFORM_EXEC_PATH}\", \
              \"envVars\": { \"TF_VAR_instance_count\": \"$CLUSTER_COUNT\", \"TF_VAR_binary_location\": \"${env.JOB_NAME}/$GIT_COMMIT/${EXTENSION_MODULE}.jar\", \"TF_VAR_stage\": \"${STAGE}\", \"TF_VAR_name\": \"${APP_NAME}\", \
              \"TF_VAR_revision_id\": \"$GIT_COMMIT\" }}' \
              ${REMOTE_PIPELINE_URL}/build/v1/pipeline/destroy/${env.STAGE}/${APP_NAME}/$GIT_COMMIT
              """.stripIndent()
              input id: "${env.STEP_ID}", message: "Waiting For Stronghold to Destroy Dev"
          }
        }
        // AAT
        stage('AAT Provisioning') {
            when {
              expression {
                  BRANCH == 'master'
              }
            }
            environment {
              STEP_ID = "RunAATProvisioning"
              STAGE = "aat"
              CLUSTER_COUNT = 3
            }
            steps {
                echo 'Running Provisioning Remotely'
                sh """\
                  curl -X POST -H "Content-Type: application/json" \
                  -d '{\"callback_url\": \"${BASE_URL}/job/${env.JOB_NAME}/${env.BUILD_ID}/input/${env.STEP_ID}/submit\", \
                  \"app_name\": \"${APP_NAME}\", \"infra_base_path\": \"${INFRA_BASE_PATH}/$GIT_COMMIT\",  \"orc_name\":\"${DATA_CENTER}\", \"execCommand\": \"${env.TERRAFORM_EXEC_PATH}\", \
                  \"envVars\": { \"TF_VAR_instance_count\": \"${env.CLUSTER_COUNT}\", \"TF_VAR_binary_location\": \"${env.JOB_NAME}/$GIT_COMMIT/${EXTENSION_MODULE}.jar\", \"TF_VAR_stage\": \"${env.STAGE}\", \"TF_VAR_name\": \"${APP_NAME}\", \
                  \"TF_VAR_revision_id\": \"$GIT_COMMIT\", \"TF_VAR_dns_record_name\": \"${APP_NAME}\" }}' \
                  ${REMOTE_PIPELINE_URL}/build/v1/pipeline/provision/${env.STAGE}/${APP_NAME}/$GIT_COMMIT
                """.stripIndent()
                input id: "${env.STEP_ID}", message: "Waiting For Stronghold to Deploy Stuff"
            }
        }
        stage('AAT Configuration') {
            when {
              expression { BRANCH == 'master' }
            }
            environment {
              STEP_ID = "RunAATConfiguration"
              ANSIBLE_PLAYBOOK = "ping/directory/master.yml"
              ORC_NAME = "group-directory"
              STAGE = "aat"
            }
            steps {
                echo 'Running Configuration Remotely'
                sh """\
                  curl -X POST -H "Content-Type: application/json" \
                  -d '{\"callback_url\": \"${BASE_URL}/job/${env.JOB_NAME}/${env.BUILD_ID}/input/${env.STEP_ID}/submit\", \"app_name\": \"${APP_NAME}\", \"infra_base_path\": \"${INFRA_BASE_PATH}/$GIT_COMMIT\", \"orc_name\":\"${DATA_CENTER}\", \
                  \"playbook\": \"${env.ANSIBLE_PLAYBOOK}\", \"execCommand\": \"${TERRAFORM_EXEC_PATH}\", \
                  \"envVars\": { \"ANSIBLE_TF_WS_NAME\": \"${env.STAGE}-${APP_NAME}\" }}' \
                  ${REMOTE_PIPELINE_URL}/build/v1/pipeline/configure/${env.STAGE}/${APP_NAME}/$GIT_COMMIT
                """.stripIndent()
                input id: "${env.STEP_ID}", message: "Waiting For Stronghold to Configure Stuff"
            }
        }
        stage('AAT-IntegrationTest') {
          when {
              expression {
                BRANCH == 'master'
              }
          }
          environment {
              STAGE = "aat"
            }
          //  steps {
          //      echo 'Running Integration tests';
          //      sh "cd $WORKSPACE/qa && ./gradlew pingDirectoryIntegration -PpingDirectoryUrl=https://${APP_NAME}.${STAGE}.${BASE_DOMAIN_DATA_CENTER} -PpingDirectoryUsername='cn=DirectoryManager' -PpingDirectoryPassword='Password_01!!' -i"
          //  }
          steps {

                echo 'Running Component ONLY Tests from integrationtests project'
                sh """\
                  cd $WORKSPACE/group-directory/tests
                  ./gradlew clean
                """.stripIndent()
              retry(2) {
                  sh """
                    cd $WORKSPACE/group-directory/tests
                    ./gradlew pingDirectorySmoke -Dpingconfig.pingDirectoryBaseUrl=https://${APP_NAME}.${STAGE}.${BASE_DOMAIN_DATA_CENTER} -i
                    sleep 10
                  """.stripIndent()
              }
          }
          post {
              always {
                  echo 'Uploading Integration Tests'
                  sh """\
                    cd $WORKSPACE/libs/pyModules
                    ./uploadDirS3.py \"$WORKSPACE/qa/build/reports/tests\" \"${ARTEFACT_BUCKET}\" \"reports/${env.JOB_NAME}\" \"${env.BUILD_ID}\"
                  """.stripIndent()
              }
              success {
                echo 'Promoting to UAT'
              }
          }
        }
      //  stage('AAT-FeatureTest') {
      //     when {
      //         expression { BRANCH == 'master' }
      //     }
      //     environment {
      //         STAGE = "aat"
      //      }
      //      steps {
      //          echo 'Running Cucumber tests'
      //          sh "cd $WORKSPACE/qa && ./gradlew cucumbertests -PpingDirectoryUrl=https://${APP_NAME}.${STAGE}.myorg.clients.domain.com -PpingDirectoryUsername='cn=Directory Manager' -PpingDirectoryPassword='Password_01!!' -i"
      //      }
      //       post {
      //          always {
      //              echo 'Uploading Cucumber Tests'
      //              sh "cd $WORKSPACE/libs/pyModules && ./uploadDirS3.py \"$WORKSPACE/qa/target\" \"terraform-myorg-${env.STAGE}\" \"reports/${env.JOB_NAME}\" \"${env.BUILD_ID}\""
      //          }
      //          success {
      //             echo 'Promoting to UAT'
      //          }
      //      }
      //  }
        stage('UAT') {
          when {
              expression {
                  BRANCH == 'master'
              }
            }
            environment {
              STEP_ID = "RunUATProvisioning"
              STAGE = "uat"
              CLUSTER_COUNT = 3
            }
            steps {
                echo 'Running Provisioning Remotely'
                sh """\
                curl -X POST -H "Content-Type: application/json" \
                -d '{\"callback_url\": \"${BASE_URL}/job/${env.JOB_NAME}/${env.BUILD_ID}/input/${env.STEP_ID}/submit\", \
                \"app_name\": \"${APP_NAME}\", \"infra_base_path\": \"${INFRA_BASE_PATH}/$GIT_COMMIT\",  \"orc_name\":\"${DATA_CENTER}\", \"execCommand\": \"${env.TERRAFORM_EXEC_PATH}\", \
                \"envVars\": { \"TF_VAR_instance_count\": \"${env.CLUSTER_COUNT}\", \"TF_VAR_binary_location\": \"${env.JOB_NAME}/$GIT_COMMIT/${EXTENSION_MODULE}.jar\", \"TF_VAR_stage\": \"${env.STAGE}\", \"TF_VAR_name\": \"${APP_NAME}\", \
                \"TF_VAR_revision_id\": \"$GIT_COMMIT\", \"TF_VAR_dns_record_name\": \"${APP_NAME}\" }}' \
                ${REMOTE_PIPELINE_URL}/build/v1/pipeline/provision/${env.STAGE}/${APP_NAME}/$GIT_COMMIT
                """.stripIndent()
                input id: "${env.STEP_ID}", message: "Waiting For Stronghold to Deploy Stuff"
            }
        }
        stage('UAT Configuration') {
            when {
              expression { BRANCH == 'master'  }
            }
            environment {
              STEP_ID = "RunUATConfiguration"
              ANSIBLE_PLAYBOOK = "ping/directory/master.yml"
              ORC_NAME = "group-directory"
              STAGE = "uat"
            }
            steps {
                echo 'Running Configuration Remotely'
                sh """\
                curl -X POST -H "Content-Type: application/json" \
                -d '{\"callback_url\": \"${BASE_URL}/job/${env.JOB_NAME}/${env.BUILD_ID}/input/${env.STEP_ID}/submit\", \"app_name\": \"${APP_NAME}\", \"infra_base_path\": \"${INFRA_BASE_PATH}/$GIT_COMMIT\", \"orc_name\":\"${DATA_CENTER}\", \
                \"playbook\": \"${env.ANSIBLE_PLAYBOOK}\", \"execCommand\": \"${TERRAFORM_EXEC_PATH}\", \
                \"envVars\": { \"ANSIBLE_TF_WS_NAME\": \"${env.STAGE}-${APP_NAME}\" }}' \
                ${REMOTE_PIPELINE_URL}/build/v1/pipeline/configure/${env.STAGE}/${APP_NAME}/$GIT_COMMIT
                """.stripIndent()
                input id: "${env.STEP_ID}", message: "Waiting For Stronghold to Configure Stuff"
            }
        }
        stage('UAT-IntegrationTest') {
          when {
              expression {
                BRANCH == 'master'
              }
          }
          environment {
              STAGE = "uat"
            }
          //  steps {
          //      echo 'Running Integration tests';
          //      sh "cd $WORKSPACE/qa && ./gradlew pingDirectoryIntegration -PpingDirectoryUrl=https://${APP_NAME}.${STAGE}.${BASE_DOMAIN_DATA_CENTER} -PpingDirectoryUsername='cn=DirectoryManager' -PpingDirectoryPassword='Password_01!!' -i"
          //  }
          steps {

                echo 'Running Component ONLY Tests from integrationtests project'
                sh """

                cd $WORKSPACE/group-directory/tests && ./gradlew clean
                """.stripIndent()
              retry(2) {
                  sh """
                  cd $WORKSPACE/group-directory/tests && ./gradlew pingDirectorySmoke -Dpingconfig.pingDirectoryBaseUrl=https://${APP_NAME}.${STAGE}.${BASE_DOMAIN_DATA_CENTER} -i
                  sleep 10
                  """.stripIndent()
              }
          }
          post {
              always {
                  echo 'Uploading Integration Tests'
                  sh "cd $WORKSPACE/libs/pyModules && ./uploadDirS3.py \"$WORKSPACE/qa/build/reports/tests\" \"${ARTEFACT_BUCKET}\" \"reports/${env.JOB_NAME}\" \"${env.BUILD_ID}\""
              }
              success {
                echo 'Promoting to OAT'
              }
          }
        }
        stage('OAT') {
            when {
              expression { BRANCH == 'master' }
          }
            steps {
                echo 'Running Operational Tests'
            }
        }
        stage('Prod') {
          when {
              expression { BRANCH == 'master' }
          }
            steps {
                echo 'Running Prod Tests'
                echo 'Deploying to Prod'
                echo 'Post Deploy to Prod'
            }
        }
        stage('Run next builds') {
          when {
              expression { BRANCH == 'master' }
          }
          parallel {
            stage('Run active-directory') {
              steps {
                build job: 'active-directory-master'
              }
            }
            stage('Run identity-management') {
              steps {
                build job: 'identity-management-master'
              }
            }
          }
        }
    }
}
``` 
