# Privacy / redaction — PAN-style checks (16-digit payment card shapes)

## No 16-digit run (contiguous PAN)

Target: safe-export.txt
Reject Regex: /\b\d{16}\b/
Fail: Possible credit/debit card number (16 consecutive digits)

## No dashed groups 4-4-4-4

Target: safe-export.txt
Reject Regex: /\b\d{4}-\d{4}-\d{4}-\d{4}\b/
Fail: Possible card number (dashed groups)

## No spaced groups 4-4-4-4

Target: safe-export.txt
Reject Regex: /\b\d{4} \d{4} \d{4} \d{4}\b/
Fail: Possible card number (space-separated groups)

## No mixed separators (optional dash or space between groups of 4)

Target: safe-export.txt
Reject Regex: /\b(?:\d{4}[- ]?){3}\d{4}\b/
Fail: Possible card number (grouped digits with optional separators)

## No digit groups with only single separators (strict variant)

Target: safe-export.txt
Reject Regex: /\b\d{4}(?:[- ]\d{4}){3}\b/
Fail: Possible card number (dashes or spaces between quartets)
