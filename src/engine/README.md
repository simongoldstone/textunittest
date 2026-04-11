# Engine Module

Test execution: resolve `Target:` files, apply location rules (`Between`, `After`, `Before`, `On Line`, `Between Lines`), evaluate assertions, and return pass/fail results.

Responsibilities:

- Resolve target paths relative to the suite file
- Apply scope rules in document order (intersecting constraints)
- Evaluate assertions (`Require`, `Reject`, `Regex`, `Count`, wildcards, fuzzy, formats, etc.)
- `Length:` checks against the whole file UTF-8 byte length
- Return structured results for the CLI and HTML reporter
