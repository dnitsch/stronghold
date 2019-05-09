# Stronghold

*DISCLAIMER* current version marked as `alpha-1.0.6`  as such it is considered in preview/alpha

## DESCRIPTION

Stronghold is an add-on tool for your existing pipeline (CI/CD) infrastructure, by exposing a wrapped interface for the tooling traditionally invoked diurectly from within your YAML/JSON it aims to increase productivity and lower wait times - by offloading that work to a backrground process so your pipeline can handle higher concurrency. 

Currenlty, it is capable of handling most cli based tools, like serverless, chef (knife), saltstack, docker, aws/azure clis etc... However, it has a deep integration with [terraform](https://www.terraform.io/) as it also exposes specific workspace methods and handles certain initialization tasks when used in conjunction with Ansible.

* For use with any other terraform [commands](https://www.terraform.io/docs/commands/index.html) use the generic orchestration provider in sequence you desire, examples can be found in the docs. 

By creating a wrapper around the CLI tools, we can control the environment in which they are executed and pass in dynamic environment variables which are not conflicting with the underlying system on which stronghold runs.

This allows for parallel/concurrent process that aren't dependant on each other's outputs.

You can find samples in the [docs](./docs/README.md)

Deployment strategy:

* currently deployable into a VM or Docker accessing the filesystem directly
* initialised and process managed through PM2 - `ecosystem.json`
  * pm2 startup - run this to create systemd script that ensures app is restarted on bootup/restart
  * pm2 save - run this to save the script in your systems process module

It is adviseable to run locally first to gain the understanding of the app and how to use the environment variables and config and secrets.

## SETUP

It's down to the user to create the environment/container with all the dependencies they require for the various configuration and orchestration tooling - i.e. `terraform`, `ansible`, `serverless`, etc...

These can be installed in via any package managers or any other method user prefers - methods description below illustrates how they can be called/used. 

They need to be accessible from within the stronghold process, `apt`, `yum`, `brew`, etc... are all fine as well as just downloading a binary and pointing to it via its full path, this can be useful when trying out new versions tools or managing multiple versions of the same CLI.

dded to `PATH` or   

Required Dependecies:
* node >= v8.x.x (preferable)
* npm

Optional:
* pm2 (can be exchanged for any other process manager supervisord, monitd etc...)
* python (preferrably 3) - if running Ansible and opting for dynamic inventory parser - see [notes](###Just\ \Some\ \Notes)
* AWS account
   * cloudwatch indexes set up prior 
     * `config/config.js` `[logConfig.cloudwatch.logGroup]` this is where you would place - see [config section](####CONFIG) 
* Postman/Paw - for local testing and blue print creation for using within pipeline definitions


Environment variables must be injected for the app to function, see below for a list requirred/default ones, whether they come from `launch.json` or `ecosystem.json` or any other way you choose to provide them doesn't matter.

Run examples:
- `PM2` example: `cd ${stronghold_dir} && pm2 start ecosystem.json --environment dev`
- VSCode --> Debug --> `stronghold` 

Stronghold Environment Variables:
```JSON
{ 
  "env": {
      "NODE_ENV": "dev",
      "AWS_DEFAULT_REGION": "eu-west-1",
      "AWS_PROFILE": "MyStrongholdAWSProfile",
      "PORT": 1337,
      "BASE_URL": "http://localhost:1337/",
      "LOGGER_TYPE": "cloudwatch",
      "PORT": "1337",
      "BASE_URL": "http://localhost:1337/",
      "LOGGER_TYPE": "cloudwatch",
      "CW_LOG_GROUP_BASE": "/myorg/sharedservices-log-container/",
      "STRONGHOLD_LOG_EVENT_SIZE": "3",
      "STRONGHOLD_TERRAFORM_PARALLELISM": "20",
      "AUTH_MODE": "basic",
      "STREAM_REMOTE_LOGGER": false
  }
}
```


#### ENVIRONMENT VARIABLES
These are totally separate from the stronghold application runtime environment variables above.

`envVars`
---
This map inside the body root of any payload can be used by the invoker as it suits them

`"envVars":{}`

* `PORT`: this will be the port underwhich stronghold runs locally, when running behind a reverse proxy or in HA clustered mode, use this port with their configuration 

* `BASE_URL`: base url used internally - can be left/defaults to `http://localhost:1337/`

* `LOGGER_TYPE`: cloudwatch (only current implementation), future updates sould include splunk/Elasticsearch

* `NODE_ENV`: defaults to `dev` - still some work to be done on this to properly parse the configuration for other deployment types.

* `AWS_DEFAULT_REGION` & `AWS_PROFILE` : only applicable if you are running Stronghold in AWS and/or using cloudwatch as your logger

* `CW_LOG_GROUP_BASE`: creates the base for cloudwatch log implementation - e.g. if you currently index your log group index like so - `/myorg/common-log-container-across-all-systems/${app/service_name}.

* `STRONGHOLD_LOG_EVENT_SIZE`: the size of the log stream before flushing from buffer to writer - default 3

* `STRONGHOLD_TERRAFORM_PARALLELISM`: defaults to 20 - which is slightly higher than the terraform default of 10

* `AUTH_MODE`: whether or not to use authentication - defaults to `none` - options `basic` || `none` - more coming soon

* `STREAM_REMOTE_LOGGER`: true||false - whether to also send logs to a remote appender - currently only cloudwatch implemented - 


NB:
--- 
* `AWS_PROFILE` can and **should** also be specified in [pipeline](####PIPELINE), [orchestration](####ORCHESTRATION) or [configuration](####CONFIGURATION) payloads, inside `envVars` key in the body, unless the CLI knows where to find defaults - e.g. with terraform if profile is unspecified and no access/secret keys are provided it should default to a profile called `default`.
 
```json
  { 
    "envVars": {
      ...
    }
  } 
```

* `STRONGHOLD_CUSTOM_AWS_PROFILE` can be set in this instance the environment variable `"AWS_PROFILE": "MyStrongholdAWSProfile"` will be removed when specified in the payload and the execution space spawned inside a separate child shell will be injected with your specified `AWS_PROFILE`. 
* If unspecified the `AWS_PROFILE` will be removed from the injected environment variables and it is down to the user to provide other forms of authentication. For example in case of [Terraform with AWS](https://www.terraform.io/docs/providers/aws/) running on Stronghold on an EC2 machine you  
* `STRONGHOLD_INHERIT_AWS_PROFILE` can be set to `true` - this will inject existing STRONGHOLD AWS_PROFILE CREDENTIALS into each execution space. (This is the least recommended option, a) security reasons - you shouldn't use the same set of credentials for running STRONHGHOLD (requiring no admin/elevated platform access) and your IaaS/PaaS credentials under same profile. Accpetable for `Local` and `Dev`)

Temporary note: once other examples from further cloud/platform providers are included and allow for a similar credential-less `STS` or role based impersonation the scope of the `profile` will be expanded.

## CONCEPTS

The REST interface is split into 3 main areas - `build`, `orchestrate`, `configure`. 

`build` 
---
This is used as a logical separator between direct invocation of either `orchestrate` or `configure` methods as it should be used from pipeline file definitions, see `samples/` and  constructs a callback payload to resume an async operation in a given pipeline.

Additionally it also contains a checkout method which should be used when running stronghold outside of the build server - i.e. when the CI checkout directory is not reacheable by `stronghold`

There is a callback interface which is not documented as it's only used internal, see notes about how to debug this locally if need be

`orchestrate`
---
WIP:
...
see examples/payloads below

`configure`
---
WIP:
...
see examples/payloads below




#### Authorization

The `config/__secrets.json` is what currently stores the secrets/tokens/passwords (this is first pass and a vault solution will be incorporated as soon as).

The contents of the json file should look like the below, you can reference them in `config/config.js` like so `secrets.GITLAB_CI_API_TOKEN` [config details](####CONFIG)

```json
{
"GITLAB_CI_API_TOKEN": "MYTOKEN_GITLAB",
"JENKINS_API_PWD": "MYTOKEN_JENKINS",
"JENKINS_URL": "",
"GITLAB_URL": "",
...
"BASIC_AUTH": {
    "username": "admin",
    "password": "admin"
  }
}
```


#### STRONGHOLD SPECIFIC VARIABLES
`Stronghold`
---

| name| type| required | default |
|---|---|---|---|
| `STRONGHOLD_tf_init` | (bool)| No | `true` |
| `STRONGHOLD_cfg_cwd` | (string) | yes - if calling configure endpoints | `None` |
|`STRONGHOLD_cfg_exec`| (string)| yes - if calling configure endpoints | `None`|  
|`STRONGHOLD_cfg_command`| (string)| yes - if calling configure endpoints | `None`|  
|`STRONGHOLD_tf_workspace`| (string)| yes - if using workspaces | `None`|  
|`STRONGHOLD_orc_exec`| (string)| yes - if using orchestration endpoint | `None`| 
|`STRONGHOLD_orc_cwd`| (string)| yes - if using workspaces | `None`|

#### CONFIG

`config/config.js` is where the configuration lives and can/should be extended by each user to suit their needs provided the pre-reqs are satisfied.

key things to change for your specifics would be the:
- `buildTool` settings
- `logConfig` settings

WIP: `winson` logger implementation multi output 

## METHODS
Currently documented version of the API is v2. 

Note: v1 has been left in the code for backwards compatibility, but users should use v2.

only the `init` is maintained in `v1/*` routes but should never have to be hit externally

#### PIPELINE

Pipeline methods
The Pipeline component is an interface method between the [configuration](####CONFIGURATION) and [orchestration](####ORCHESTRATION) methods that is intedend to be called from a pipeline tool of your choice (currently supported: [jenkins](samples/jenkins/README.md), [gitlab](samples/gitlab/README.md)).

Additional keys need to passed in the body request that are used by the subsequent callback to the CI tool 

|Name|type|required|sample value|
|----|----|--------|------------|
| `callback_url` | string | All | https://gitlab.com/myproject/idam/pipelines/1111|
|`callback_next`|string| Gitlab| `dev:aws:my:manual:job`|
|`callback_pipeline_id`| string | Gitlab| `1234`|
|`callback_project_id`|string| Gitlab| `21`|
|`callback_ci_type` |string| Gitlab| `gitlab|| jenkins || TBD` |

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
    "STRONGHOLD_cfg_cwd": "/var/my/dir/component-y/configuration/playbooks",
    "STRONGHOLD_cfg_command": ["-i", "/var/my/dir/libs/pyModules/terraform.py", "master.yml"],
    "STRONGHOLD_cfg_exec": "ansible-playbook",
    "envVars": {
        "ANSIBLE_TF_WS_NAME": "aat-component-y",
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

The other method of note that could be use is the `checkout` method. When running stronghold centrally for a large pipeline you could also use the checkout function to create a separate folder per commit. Particularly helpful with mono repos or larger teams, though not a bad idea in general - you must use checkout of you are not running stronghold on the same server as e.g. Jenkins, when running container based CI like Gitlab it is adviseable to do this anyway as you will see the most performance this way.

Currently only supports (defaults to) SSH authentication so you must make sure you have the hostname and keys trusted in the config.

```
Host gitlab.com *.gitlab.com
    IdentityFile ~/.ssh/myuser
    StrictHostKeyChecking no

Host gitlab.myorg.com
    IdentityFile ~/.ssh/git-service
    StrictHostKeyChecking no
```

Path parameters:

- `{{sync}}` - path parameter - bool - whether or not to run this operation in backround and notify the CI/CD after completion
- `{{sha_id}}` - commit id - will be used to create a folder inside the `infra_base_path` value. e.g. `/var/myrepo/129031293714230sdf9sd7f`

Method: `POST`

Route: `http://localhost:1337/build/v2/pipeline/checkout/{{sha}}/{{sync}}`

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

TBD - examples and finish this


#### ORCHESTRATION

1. Terraform Specific Create

create a terraform workspace and run infrastructure definitions 
STRONGHOLD_tf_workspace can be set to `default` to use the default workspace which is what you are using if you are not specifically using tf workspaces. Though it is recommended to use workspaces when dealing with terraform, you don't have to. 

when called in the background it will check if a workspace exists, if `STRONGHOLD_tf_workspace` doesn't exist it will create it and if it does exist it will simply switch into it and run apply inside.

you can specify any relevant environment variables to the project inside the envVars - see terraform docs around [enviroment variables](https://www.terraform.io/docs/commands/environment-variables.html) to see how best to leverage these.

Method: `POST`

Route: `http://localhost:1337/orchestration/v2/workspace/${stage}/${app_name}/${commit_id}` 

Body:
```JSON
{
  "STRONGHOLD_tf_workspace": "task-id-1890-gd",
  "STRONGHOLD_orc_exec": "/path/to/exec/terraform",
  "STRONGHOLD_orc_cwd": "/var/dir/to/my/orchestration/aws",
  "envVars": {
        "TF_VAR_instance_count": "3",
        "TF_VAR_binary_location": "some.jar",
        "TF_VAR_stage": "dev",
        "TF_VAR_name": "component-name",
        "OS_IDENTITY_API_VERSION": "v3"
        ...
  }
}
```

2. Terraform Specific Delete

Just like above except it will error if workspace does not exist.

Method: `DELETE`

Route: `http://localhost:1337/orchestration/v2/workspace/${stage}/${app_name}/${commit_id}` 

Body: 
```JSON
  {
    "STRONGHOLD_tf_workspace": "task-id-1890-gd",
    "STRONGHOLD_orc_exec": "/path/to/exec/terraform",
    "STRONGHOLD_orc_cwd": "/var/my/dir/group-directory/orchestration/aws",
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

3. Generic Orchestration runner 


Method: `POST`

Route: `http://localhost:1337/orchestration/v2/workspace/${stage}/${app_name}/${commit_id}` 

Body: 
```JSON
  {
    "STRONGHOLD_orc_exec": "/path/to/exec/srvls",
    "STRONGHOLD_orc_cwd": "/var/my/dir/group-directory/orchestration/aws",
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

TODO: fix the path name of this method `playbook`is too ansible specific.

In a standard orchestrate configure flow, this method is kept on its own to create a separation of concern between the actions. 

NB: when using serverless or terraform for deploying functions (aws lambda, azure/gcp functions) the orchestrate step is the

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

## TODO/WIP:



Multi-instance/container deployment considerations
---
Stronghold as such is stateless however most of the CLI's require Filesystem readable data and working directories to function correctly - e.g. `Ansible`, `Terraform`, `serverless`

NOTE: mount S3 drive[link](https://github.com/s3fs-fuse/s3fs-fuse)

### logger_lib
logging is implemented using the `winston` lib and exposes to 2 writers currently - `console` and `customTransport`

`LOG_EVENT` - expand on this

allow users the ability to have greater control over logging interface and urls or file outputs for agents installation

normalise external contract - i.e. `cwd` doesn;t need 2 separate variables - `...orc_cwd` & `..cfg_cwd`

Potentially all orchestration external methods should use `PUT` as per RFC - as all operations are idempotent 

Some testing/generalization for windows based environments is still required. (`spawn` method of `child_process` behaves differently within windows OS and requires different defaults to ensure the pipe I/O IPC affords the same scale os *nix based systems )

...


## START 
### pm2

```bash
cd $stonghold_dir
pm2 start ecosystem.json --env dev
```

### Docker

```bash
docker run -d \
    -v /var/my/dir/infrastructure/keys/:/var/my/dir/infrastructure/keys/ \ # Optional (cannot be used with S3_KEYS)
    -e S3_KEYS=true \ # Optional
    -e AWS_REGION=eu-west-1 \ # Optional or AWS instance profile
    -e AWS_PROFILE=my_profile \ # Optional or AWS instance profile
    -e AWS_ACCESS_KEY_ID=12345 \ # Optional or AWS instance profile
    -e AWS_SECRET_ACCESS_KEY=09876543 \ # Optional or AWS instance profile
    -p 1337:1337 \
    repository/stronghold:latest
```

### Additional Usage Notes

#### NVM

When using NVM and VSCode, you might need to do the following to avoid adding a specific `runtimeExecutable` into the `launch.json` definition

```bash 
source ~/.bashrc ||  ~****/.bash_profile; 
nvm alias default ${your preferred version}
```

### Tests
`npm run unit_test`

`npm run integration_test`


### Just Some Notes
When using Terraform for orchestration it is highly recommended to utilise workspaces as this will not only minimise your code base but allows for scale and parallelism which is `Stronghold`'s purpose 

CI/CD tools integrated -currently only Jenkins and Gitlab are integrated - Gitlab as a container based tool will offer greater scale capacity as Jenkins (non-container version) (NB: WIP research Jenkins Containers within pipelines) 

of the 2 it is always preferable to use a container based 

Recommended for use with Ansible and terraform:
* [ansible provider for terraform](https://github.com/nbering/terraform-provider-ansible/releases)

* [ansible dynamic inventory parser](https://github.com/nbering/terraform-inventory)


### FYIs:

Incorrect ANSIBLE_TF_DIR can lead to:
```BASH
    [ERROR]:  Error: spawn /var/my/dir/infrastructure/exec/terraform ENOENT
    terraform.js:128
    2018-05-30T14:16:28.364Z: [EXITCODE] -2
    background_worker.js:127
    Command: /var/my/dir/infrastructure/exec/terraform
    [ERROR]:  Error: spawn /var/my/dir/infrastructure/exec/terraform ENOENT
    terraform.js:128
    failed execution
    terraform.js:159
    Object {responseData: "undefinedError: spawn /var/my/dir/infrastructure/exe…", code: "TERRAFORM120x5"}
    ansible.js:56
    undefined
```
