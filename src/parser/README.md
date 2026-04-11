# Parser Module

Markdown suite parsing: headings, rule lines, string literals, and a stable AST consumed by the engine.

Responsibilities:

- Read Markdown suite files (via the public `parseSuiteMarkdown` API)
- Parse headings and rule lines
- Produce a stable AST for execution
- Surface clear parse errors (line-oriented diagnostics)
