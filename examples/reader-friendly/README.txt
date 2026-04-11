Reader-friendly DSL examples
=============================

sample-output.txt — tiny report-shaped file.

reader-friendly-suite.md — demonstrates plain-English rules:
  First Line Must Equal, Last Line Must Equal, Line Must Equal,
  Require Any Of (OR), Reject Any Of,
  Count: at least / at most / between (for text and regex),
  Reject Format, and HTML comments on their own lines.

  npx textunittest validate examples/reader-friendly/reader-friendly-suite.md
