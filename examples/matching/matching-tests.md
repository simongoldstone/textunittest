# Matching extensions demo

## Wildcard invoice line

Target: matching-sample.txt
Require Pattern: "Invoice * Total"

## Fuzzy status line

Target: matching-sample.txt
Tolerance: 90%
Fuzzy Require: "Operation completed successfully"

## Email present

Target: matching-sample.txt
Require Format: Email

## Valid calendar date

Target: matching-sample.txt
Require Format: Date(dd-mm-yyyy)

## Ref wildcard

Target: matching-sample.txt
Require Pattern: "Ref * End"

## Custom invoice id mask

Target: matching-sample.txt
Require Format: Mask(INV-9999-AAA)
