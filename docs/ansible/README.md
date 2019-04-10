###### 1. Configuration Run

TODO: fix the path name of this method


below example 

Method: PUT

Route: `http://localhost:1337/configuration/v2/playbook/${stage}/${app_name}/${commit_id}`

Body:
```JSON 
  {
      "STRONGHOLD_tf_init": true,
      "STRONGHOLD_cfg_cwd": "/var/my/dir/component-y/configuration/playbooks",
      "STRONGHOLD_cfg_command": ["-i", "/var/my/dir/libs/pyModules/terraform.py", "sailpoint/master.yml"],
      "STRONGHOLD_cfg_exec": "ansible-playbook",
      "envVars": {
          "ANSIBLE_TF_WS_NAME": "aat-component-y",
          "ANSIBLE_LIBRARY": "{{project_root}}/libs/configuration/modules/",
          "ANSIBLE_TF_BIN": "/var/my/dir/infrastructure/exec/terraform",
          "ANSIBLE_TF_DIR": "/var/my/dir/component-y/orchestration/aws",
          "ANSIBLE_DEBUG": 0,
          "ANSIBLE_HOST_KEY_CHECKING": false,
          "ANSIBLE_CONFIG": "/var/my/dir/component-y/configuration/ansible.cfg",
          "ANSIBLE_VAULT_PASSWORD_FILE": "/var/my/dir/infrastructure/keys/vault-password-file",
          "ANSIBLE_SSH_RETRIES": 5
      }
  }
```
