# Regex Validation Tests

## Ensure build id is numeric

Target: regex-output.txt
Regex: /Build ID: \d+/

## Ensure status is not fail

Target: regex-output.txt
Reject Regex: /Status:\s+FAIL/

## Ensure timestamp appears once

Target: regex-output.txt
Count: 1 matches /Started:\s+\d{4}-\d{2}-\d{2}T/
