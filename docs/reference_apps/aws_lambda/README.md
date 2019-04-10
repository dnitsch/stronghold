# Lambda Deployment

`${git_stronghold} is where you checked out the stronghold repo


```
{
    "STRONGHOLD_orc_exec": "terraform",
    "STRONGHOLD_orc_cwd": "${git_stronghold}/docs/reference_apps/aws_lambda/orchestration",
    "STRONGHOLD_tf_workspace": "${CI_COMMIT}",
    "envVars": {
        "TF_VAR_name": "${CI_COMMIT}",
        "TF_VAR_stage": "dev"
    }
}
```



