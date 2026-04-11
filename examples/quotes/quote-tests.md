# Quote escaping examples

## Doubling double quotes

Target: quote-sample.txt
Require: "Line A: say ""hello"""

## Single quotes with apostrophe doubling

Target: quote-sample.txt
Require: 'Line B: it''s ok'

## Backticks in content (single-quoted literal avoids nested-backtick parsing)

Target: quote-sample.txt
Require: 'Line C: `tick`'

## Backslash escapes in a double-quoted string

Target: quote-sample.txt
Require: "Line A: say \"hello\""
