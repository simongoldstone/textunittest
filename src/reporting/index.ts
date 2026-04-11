import type { SuiteRunResult } from "../engine/index.js";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Human-readable summary for stdout. */
export function formatConsoleReport(suites: SuiteRunResult[]): string {
  const lines: string[] = [];
  let totalFailed = 0;
  let totalPassed = 0;

  for (const suite of suites) {
    lines.push(`Suite: ${suite.suiteTitle}`);
    for (const r of suite.results) {
      if (r.error) {
        lines.push(`  FAIL  ${r.testName}`);
        lines.push(`         ${r.error}`);
        totalFailed++;
        continue;
      }
      if (r.passed) {
        lines.push(`  OK    ${r.testName}`);
        totalPassed++;
      } else {
        lines.push(`  FAIL  ${r.testName}`);
        for (const f of r.failures) {
          lines.push(`         ${f}`);
        }
        totalFailed++;
      }
    }
    lines.push("");
  }

  lines.push(`Tests passed: ${totalPassed}, failed: ${totalFailed}`);
  return lines.join("\n").trimEnd() + "\n";
}

/** Minimal HTML report with pass/fail table. */
export function formatHtmlReport(suites: SuiteRunResult[]): string {
  const rows: string[] = [];
  for (const suite of suites) {
    rows.push(`<tr><th colspan="3" class="suite">${escapeHtml(suite.suiteTitle)}</th></tr>`);
    for (const r of suite.results) {
      const status = r.error ? "error" : r.passed ? "pass" : "fail";
      const label = r.error ? "Error" : r.passed ? "Pass" : "Fail";
      const detail = r.error
        ? escapeHtml(r.error)
        : r.passed
          ? ""
          : escapeHtml(r.failures.join("; "));
      rows.push(
        `<tr class="${status}"><td>${escapeHtml(label)}</td><td>${escapeHtml(r.testName)}</td><td>${detail}</td></tr>`,
      );
    }
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <title>TextUnitTest Report</title>
  <style>
    body { font-family: system-ui, sans-serif; margin: 1.5rem; color: #1a1a1a; }
    table { border-collapse: collapse; width: 100%; max-width: 960px; }
    th, td { border: 1px solid #ccc; padding: 0.5rem 0.75rem; text-align: left; vertical-align: top; }
    th.suite { background: #f0f0f0; font-size: 1.05rem; }
    tr.pass td:first-child { color: #0a6e0a; font-weight: 600; }
    tr.fail td:first-child, tr.error td:first-child { color: #b00020; font-weight: 600; }
  </style>
</head>
<body>
  <h1>TextUnitTest Report</h1>
  <table>
    <thead>
      <tr><th>Status</th><th>Test</th><th>Details</th></tr>
    </thead>
    <tbody>
      ${rows.join("\n      ")}
    </tbody>
  </table>
</body>
</html>
`;
}
