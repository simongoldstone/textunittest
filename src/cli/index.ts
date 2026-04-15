#!/usr/bin/env node
import { readdir, readFile, stat, writeFile } from "node:fs/promises";
import { basename, isAbsolute, join, resolve } from "node:path";
import { program } from "commander";
import { runSuite } from "../engine/index.js";
import { parseSuiteMarkdown } from "../parser/index.js";
import { formatConsoleReport, formatHtmlReport } from "../reporting/index.js";
import type { SuiteRunResult } from "../engine/index.js";

async function collectMarkdownFiles(root: string): Promise<string[]> {
  const results: string[] = [];

  async function walk(dir: string): Promise<void> {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const e of entries) {
      const p = join(dir, e.name);
      if (e.isDirectory()) {
        await walk(p);
      } else if (e.isFile() && e.name.endsWith(".md")) {
        results.push(p);
      }
    }
  }

  await walk(root);
  return results.sort();
}

async function validatePaths(paths: string[], cwd: string, params: Record<string, string>): Promise<SuiteRunResult[]> {
  const resolved = paths.map((p) => (isAbsolute(p) ? p : resolve(cwd, p)));
  const allSuites: SuiteRunResult[] = [];

  for (const target of resolved) {
    const st = await stat(target);
    const files: string[] = [];
    if (st.isDirectory()) {
      files.push(...(await collectMarkdownFiles(target)));
    } else if (st.isFile()) {
      files.push(target);
    } else {
      throw new Error(`not a file or directory: ${target}`);
    }

    if (files.length === 0) {
      console.error(`No .md suite files found under ${target}`);
    }

    for (const file of files) {
      const source = await readFile(file, "utf8");
      const parsed = parseSuiteMarkdown(source, basename(file), params);
      if (!parsed.ok) {
        for (const err of parsed.errors) {
          console.error(err);
        }
        throw new Error(`parse failed: ${file}`);
      }
      const run = await runSuite(file, parsed.suite, params);
      allSuites.push(run);
    }
  }

  return allSuites;
}

program
  .name("textunittest")
  .description("Human-readable Markdown unit testing for generated text files")
  .showHelpAfterError();

program
  .command("validate")
  .description("Run Markdown validation suites (.md) against target text files")
  .argument("[paths...]", "Suite files or directories to scan for .md suites", ".")
  .option("--html <file>", "Write an HTML report to the given path")
  .option(
    "--var <name=value>",
    "Define an external variable for template substitution and If: conditions (repeatable)",
    (pair: string, prev: string[]) => [...prev, pair],
    [] as string[],
  )
  .action(async (paths: string[], opts: { html?: string; var: string[] }) => {
    const cwd = process.cwd();
    // Parse --var name=value pairs into a Record
    const params: Record<string, string> = {};
    for (const pair of opts.var) {
      const eqIdx = pair.indexOf("=");
      if (eqIdx === -1) {
        // Bare name without value — treat as "true"
        params[pair] = "true";
      } else {
        params[pair.slice(0, eqIdx)] = pair.slice(eqIdx + 1);
      }
    }
    try {
      const list = paths.length > 0 ? paths : ["."];
      const suites = await validatePaths(list, cwd, params);
      const anyFailed = suites.some((s) =>
        s.results.some((r) => r.error !== undefined || !r.passed),
      );
      process.stdout.write(formatConsoleReport(suites));
      if (opts.html) {
        const outPath = isAbsolute(opts.html) ? opts.html : resolve(cwd, opts.html);
        await writeFile(outPath, formatHtmlReport(suites), "utf8");
        process.stdout.write(`\nHTML report written to ${outPath}\n`);
      }
      process.exitCode = anyFailed ? 1 : 0;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error(msg);
      process.exitCode = 1;
    }
  });

program.parse();
