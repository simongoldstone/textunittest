# Invoice Validation Suite

## Ensure version number exists

Target: invoice.txt
Require: "Version:"
Between: "Welcome to Example Corp" and "Copyright 2026 Example Corp"
Fail: Version number missing from header

## Ensure invoice id matches expected format

Target: invoice.txt
Regex: /Invoice Number: INV-\d{4}/

## Ensure there are exactly two line items

Target: invoice.txt
Count: 2 of "Line Item:"

## Ensure placeholder text is absent

Target: invoice.txt
Reject: "TBD"

## Ensure invoice file size is within bounds

Target: invoice.txt
Length: between 100 and 100000
