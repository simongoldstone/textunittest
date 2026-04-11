# CRM-generated service agreement — validation suite

## Document identity and control block

Target: crm-generated-service-agreement.txt
Require: "MASTER SERVICE AGREEMENT (ENTERPRISE TIER)"
Fail: Agreement title or tier missing from export

## Agreement reference follows CTR-YYYY-NNNNNN

Target: crm-generated-service-agreement.txt
Regex: /Agreement reference:\s+CTR-2026-\d{6}/

## Order and framework references present

Target: crm-generated-service-agreement.txt
Require: "ORD-2026-118472-A"
Require: "FWK-2024-ENT-MASTER"

## Correlation UUID (CRM traceability)

Target: crm-generated-service-agreement.txt
Require Format: UUID

## Correlation ID on the expected document-control line

Target: crm-generated-service-agreement.txt
On Line: 11
Require Format: UUID

## Effective date on control line uses calendar date format

Target: crm-generated-service-agreement.txt
On Line: 16
Require Format: Date(dd/mm/yyyy)

## Template and batch metadata present

Target: crm-generated-service-agreement.txt
Require: "TPL-SA-ENT-UK-2026-Q1"
Require: "batch job #882914"

## Party — customer legal entity

Target: crm-generated-service-agreement.txt
Require: "Acme Manufacturing Limited"
Require: "08472919"

## Party — supplier entity and registration

Target: crm-generated-service-agreement.txt
Require: "Apex Solutions Group plc"
Require: "02938472"

## VAT numbers for both parties

Target: crm-generated-service-agreement.txt
Require: "GB 284 7291 09"
Require: "GB 847 291 663"

## Registered office includes valid UK postcodes

Target: crm-generated-service-agreement.txt
Require Format: UKPostcode

## Billing contact block contains primary email

Target: crm-generated-service-agreement.txt
Between: "Primary billing contact" and "Primary technical contact"
Require Format: Email

## Technical contact email

Target: crm-generated-service-agreement.txt
Require: "james.morris@acmemanufacturing.example.co.uk"

## Escalation contact email

Target: crm-generated-service-agreement.txt
Require: "helen.okonkwo@acmemanufacturing.example.co.uk"

## Apex account team addresses

Target: crm-generated-service-agreement.txt
Count: 4 of "apex-solutions.example.co.uk"

## SKU table lists five PRD line items

Target: crm-generated-service-agreement.txt
Between: "4.3 The following" and "4.4 Professional services"
Count: 5 of "PRD-"

## Product SKU matches enterprise mask on line range

Target: crm-generated-service-agreement.txt
Between Lines: 111 and 115
Require Format: Mask(PRD-AAA-AAA-999)

## Commercial pricing table by line range (detail lines only)

Target: crm-generated-service-agreement.txt
Between Lines: 133 and 144
Require: "£124,920.00"
Require: "VAT (20%)"
Require Format: Currency(£)

## Data protection clauses by line range (section 10 body)

Target: crm-generated-service-agreement.txt
Between Lines: 227 and 240
Require: "DPA-UK-2026-01"
Require: "UK GDPR"
Require: "CUST-009472"

## Signature block by line range (both execution dates)

Target: crm-generated-service-agreement.txt
Between Lines: 314 and 326
Count: 2 of "28/04/2026"
Require Format: Date(dd/mm/yyyy)

## Commercial table includes subtotal VAT and total

Target: crm-generated-service-agreement.txt
Between: "5. COMMERCIAL" and "6. TERM"
Require: "£104,100.00"
Require: "VAT (20%)"
Require: "£124,920.00"

## Commercial section uses GBP currency tokens

Target: crm-generated-service-agreement.txt
Between: "5. COMMERCIAL" and "6. TERM"
Require Format: Currency(£)

## CRM billing profile ID embedded

Target: crm-generated-service-agreement.txt
Require: "BILL-ACME-77821"

## Liability cap clause

Target: crm-generated-service-agreement.txt
Between: "11. LIABILITY" and "12. INSURANCE"
Require: "£500,000"

## Consequential loss exclusion (fuzzy — tolerate line wrap in export)

Target: crm-generated-service-agreement.txt
Tolerance: 88%
Fuzzy Require: "Neither party is liable for loss of profits, loss of revenue, loss of"

## Data protection — UK GDPR reference

Target: crm-generated-service-agreement.txt
Between: "10. DATA PROTECTION AND SECURITY" and "11. LIABILITY AND INDEMNITIES"
Require: "UK GDPR"

## DPA reference and subprocessors URL

Target: crm-generated-service-agreement.txt
Require: "DPA-UK-2026-01"
Require: "subprocessors"

## Customer transfer record ID

Target: crm-generated-service-agreement.txt
Require: "CUST-009472"

## Term length and renewal notice

Target: crm-generated-service-agreement.txt
Require: "thirty-six (36) months"
Require: "ninety (90) days"

## SLA priority and SLA addendum

Target: crm-generated-service-agreement.txt
Require: "P1 — Production down: response within 1 hour"
Require: "SLA-ENT-2026-03"

## Schedule A optional modules

Target: crm-generated-service-agreement.txt
After: "SCHEDULE A — PRODUCT"
Require: "MOD-ANA-2026-01"
Require: "MOD-SBX-ADD-01"

## Schedule B acceptance ticket

Target: crm-generated-service-agreement.txt
Require: "CS-774821"

## Signature dates aligned

Target: crm-generated-service-agreement.txt
Count: 2 of "28/04/2026"

## Support desk international number

Target: crm-generated-service-agreement.txt
Regex: /Support desk \(24x7\):\s+\+44 20 7946 0958/

## Apex main switchboard matches UK phone mask

Target: crm-generated-service-agreement.txt
Require Format: Phone(020 9999 9999)

## Wildcard match on professional services line

Target: crm-generated-service-agreement.txt
Require Pattern: "Professional Services — * Person-days"

## No placeholder tokens leaked from template

Target: crm-generated-service-agreement.txt
Reject: "TBD"
Reject: "{{"
Reject: "}}"

## Pound symbol count in commercial and pricing body

Target: crm-generated-service-agreement.txt
Count: 15 of "£"

## UTF-8 file size sane for enterprise PDF text extract

Target: crm-generated-service-agreement.txt
Length: at least 12000
Length: at most 500000

## Opening frame matches text export style

Target: crm-generated-service-agreement.txt
Starts With: "===="

## Closing agreement marker present

Target: crm-generated-service-agreement.txt
Require: "END OF AGREEMENT"

## Generation timestamp line includes timezone

Target: crm-generated-service-agreement.txt
After: "Generation timestamp:"
Require: "Europe/London"

## Force Majeure section heading

Target: crm-generated-service-agreement.txt
Require: "FORCE MAJEURE"

## Exclusive jurisdiction clause

Target: crm-generated-service-agreement.txt
Require: "exclusive jurisdiction"

## Insurance section bounded

Target: crm-generated-service-agreement.txt
Between: "12. INSURANCE" and "13. FORCE"
Require: "professional indemnity"

## No credit-card style number sequences in export

Target: crm-generated-service-agreement.txt
Reject Regex: /\b\d{4}-\d{4}-\d{4}-\d{4}\b/

## Case-insensitive match for customer trading name

Target: crm-generated-service-agreement.txt
Case: insensitive
Require: "acme uk operations"
