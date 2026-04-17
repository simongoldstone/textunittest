# Variables Example Suite

<!-- Run with: textunittest validate examples/variables --var env=staging --var version=4.7.1 --var checkEmail=yes -->

## Confirm environment label

Target: report.txt
Require: "environment: {{env}}"

## Confirm build version

Target: report.txt
Require: "Build: {{version}}"

## Check for contact email (only when checkEmail=yes)

<!-- This test is skipped unless --var checkEmail=yes is passed. -->

Target: report.txt
If: {{checkEmail=yes}}
Require Format: Email

## Skip debug assertions in CI

<!-- Only run this test when env is NOT ci. -->

Target: report.txt
If: {{env!=ci}}
Require: "Status: OK"

## Only run when feature flag is set

<!-- Run with --var runAdvanced=true to include this test. -->

Target: report.txt
If: {{runAdvanced}}
Require: "Deployment region:"
