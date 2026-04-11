Contracts example
=================

This folder contains a large, realistic CRM-style export and a full validation suite.

  crm-generated-service-agreement.txt
    Master Service Agreement text: parties, contacts, SKU table, commercial pricing,
    VAT, term, SLA, GDPR/DPA, liability, schedules, signatures. Filled as if
    generated from a complex CRM (references, UUID, UK entities, GBP amounts).

  contract-validation-suite.md
    Markdown suite with many tests (Require, Regex, Between / After, On Line:,
    Between Lines: (several line-range checks on the agreement), Require Format,
    Count, Fuzzy Require, Require Pattern,
    Length, Reject, Case, etc.).

Run from the repo root:

  npx textunittest validate examples/contracts/contract-validation-suite.md

To validate all example suites under examples/ (every .md file is treated as a suite),
use:

  npx textunittest validate examples

Note: Suite files must not use Markdown horizontal rules (---) on their own lines under
the suite title, and prose cannot sit between # and the first ## test (use this
README.txt for narrative). See docs/syntax-guide.md.
