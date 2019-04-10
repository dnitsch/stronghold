# Docs

Includes expanded documentation on use cases and examples


Build Server pipelineswith `async` jobs:
-  Jenkins jobs using `input`
-  Gitalb using `when: manual`

Detailed payload examples:



All pipeline methods are `POST` anmd should include the above values, example below is using the configuration run [method](######1.\ \Configuration\ \Run)

`POST`
```JSON 
{
    "callback_url": "https://gitlab..com/my_org/my_project/pipelines/1234",
    "callback_next": "ig:dev:aws:test",
    "callback_pipeline_id": "2234",
    "callback_project_id": "21",
    "callback_ci_type": "gitlab",
    "STRONGHOLD_tf_init": true,
    "STRONGHOLD_cfg_cwd": "/var/idam/identity-governance/configuration/playbooks",
    "STRONGHOLD_cfg_command": ["-i", "/var/idam/libs/pyModules/terraform.py", "sailpoint/master.yml"],
    "STRONGHOLD_cfg_exec": "ansible-playbook",
    "envVars": {
        "ANSIBLE_TF_WS_NAME": "aat-identity-governance",
        "ANSIBLE_TF_BIN": "/var/idam/infrastructure/exec/terraform",
        "ANSIBLE_TF_DIR": "/var/idam/identity-governance/orchestration/aws",
        "ANSIBLE_DEBUG": 0,
        "ANSIBLE_HOST_KEY_CHECKING": false,
        "ANSIBLE_CONFIG": "/var/idam/identity-governance/configuration/ansible.cfg",
        "ANSIBLE_VAULT_PASSWORD_FILE": "/var/idam/infrastructure/keys/vault-password-file",
        "ANSIBLE_SSH_RETRIES": 5
    }
}
```

The other method of note that could be use is the `checkout` method. 

Method: `POST`

Route: `http://localhost:1337/build/v2/pipeline/checkout/{{sha}}/true`

```json
{
    "callback_url": "{{ci_pipeline_url}}{{pipeline_id}}",
    "callback_next": "{{component_initials}}:{{stage}}:{{provider}}:{{next}}",
    "callback_pipeline_id": "{{pipeline_id}}",
    "callback_project_id": "{{gitlab_project_id}}",
    "callback_ci_type": "{{ci}}",
    "infra_base_path": "{{project_root}}-test-clone",
    "git_branch": "{{branch}}",
    "git_url": "git@gitlab.com:my_org/my_project.git"
}
```

You need to ensure you valid SSH keys and trusted hosts in your ssh config.

TBD - examples and finish this


#### ORCHESTRATION

1. Terraform Specific Create

create a terraform workspace and run infrastructure definitions 
STRONGHOLD_tf_workspace can be set to `default` to use the default workspace which is what you are using if you are not specifically using tf workspaces

Method: `POST`
  
Route: `http://localhost:1337/orchestration/v2/workspace/${stage}/${app_name}/${commit_id}` 
  
Body:
```JSON
{
  "STRONGHOLD_tf_workspace": "task-id-1890-gd",
  "STRONGHOLD_orc_exec": "/path/to/exec/terraform",
  "STRONGHOLD_orc_cwd": "/var/idam/group-directory/orchestration/aws",
  "envVars": {
        "TF_VAR_instance_count": "3",
        "TF_VAR_binary_location": "some.jar",
        "TF_VAR_stage": "dev",
        "TF_VAR_name": "group-directory",
        "OS_IDENTITY_API_VERSION": "v3"
        ...
  }
}
```

2. Terraform Specific Delete

Delete a terraform workspace and run infrastructure definitions 
Method: `POST`

Route: `http://localhost:1337/orchestration/v2/workspace/${stage}/${app_name}/${commit_id}` 

Body: 
```JSON
  {
    "STRONGHOLD_tf_workspace": "task-id-1890-gd",
    "STRONGHOLD_orc_exec": "/path/to/exec/terraform",
    "STRONGHOLD_orc_cwd": "/var/idam/group-directory/orchestration/aws",
    "envVars": {
          "TF_VAR_instance_count": "3",
          "TF_VAR_binary_location": "some.jar",
          "TF_VAR_stage": "dev",
          "TF_VAR_name": "group-directory",
          "OS_IDENTITY_API_VERSION": "v3"
          ...
        }
    }
```

3. Generic runner

generic cli runner - e.g. serverless

Method: `POST`

Route: `http://localhost:1337/orchestration/v2/workspace/${stage}/${app_name}/${commit_id}` 

Body: 
```JSON
  {
    "STRONGHOLD_orc_exec": "/path/to/exec/srvls",
    "STRONGHOLD_orc_cwd": "/var/idam/group-directory/orchestration/aws",
    "STRONGHOLD_orc_command": ["run","-vvv"],
    "envVars": {
          "SERVERLESS_instance_count": "3",
          "TF_VAR_binary_location": "some.jar",
          "TF_VAR_stage": "dev",
          "TF_VAR_name": "group-directory",
          "OS_IDENTITY_API_VERSION": "v3"
          ...
        }
    }
  ```

#### CONFIGURATION

###### 1. Configuration Run

Method: PUT

Route: `http://localhost:1337/configuration/v2/playbook/${stage}/${app_name}/${commit_id}`

Body:
```JSON 
  {
      "STRONGHOLD_tf_init": true,
      "STRONGHOLD_cfg_cwd": "/var/idam/identity-governance/configuration/playbooks",
      "STRONGHOLD_cfg_command": ["-i", "/var/idam/libs/pyModules/terraform.py", "sailpoint/master.yml"],
      "STRONGHOLD_cfg_exec": "ansible-playbook",
      "envVars": {
          "ANSIBLE_TF_WS_NAME": "aat-identity-governance",
          "ANSIBLE_TF_BIN": "/var/idam/infrastructure/exec/terraform",
          "ANSIBLE_TF_DIR": "/var/idam/identity-governance/orchestration/aws",
          "ANSIBLE_DEBUG": 0,
          "ANSIBLE_HOST_KEY_CHECKING": false,
          "ANSIBLE_CONFIG": "/var/idam/identity-governance/configuration/ansible.cfg",
          "ANSIBLE_VAULT_PASSWORD_FILE": "/var/idam/infrastructure/keys/vault-password-file",
          "ANSIBLE_SSH_RETRIES": 5
      }
  }
```
