# Reader-friendly rules demo

<!-- You can add notes like this — the runner ignores full-line HTML comments. -->

## First line is the report banner

Target: sample-output.txt
First Line Must Equal: "BEGIN REPORT"

## Last line closes the report

Target: sample-output.txt
Last Line Must Equal: "END"

## Specific line equals exact text

Target: sample-output.txt
Line Must Equal: 1 "BEGIN REPORT"

## At least one of several phrases (OR)

Target: sample-output.txt
Require Any Of: "BEGIN REPORT" or "START" or "HEADER"

## None of these problem words

Target: sample-output.txt
Reject Any Of: "ERROR" or "FAILED" or "TBD"

## Count at least once

Target: sample-output.txt
Count: at least 1 of "Status"

## Count at most a ceiling

Target: sample-output.txt
Count: at most 10 of "OK"

## Count in a range

Target: sample-output.txt
Count: between 1 and 5 of "Ref"

## Regex count with at least

Target: sample-output.txt
Count: at least 1 matches /ABC-\d+/

## No email-shaped data in this export

Target: sample-output.txt
Reject Format: Email
