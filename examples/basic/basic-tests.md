# Basic Validation Tests

## Ensure version exists

Target: sample-output.txt
Require: "Version:"

## Ensure no errors exist

Target: sample-output.txt
Reject: "ERROR"

## Ensure version is in the header section

Target: sample-output.txt
Require: "Version: 1.2.3"
Between: "Welcome to Sample App" and "Copyright 2026 TextUnitTest"
