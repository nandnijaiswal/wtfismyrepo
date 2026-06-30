#!/usr/bin/env node
/**
 * wtfismyrepo CLI — point it at a repo and it tells you what's going on.
 *
 *   wtfismyrepo [path] [--json] [--no-history] [--top N] [--no-color]
 */
import { analyze } from "../src/analyze.mjs";
import { renderText, renderJSON } from "../src/report.mjs";

function parseArgs(argv) {
  const opts = { path: ".", json: false, history: true, top: 10, color: true };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--json") opts.json = true;
    else if (a === "--no-history") opts.history = false;
    else if (a === "--no-color") opts.color = false;
    else if (a === "--top") opts.top = parseInt(argv[++i], 10) || 10;
    else if (a === "-h" || a === "--help") opts.help = true;
    else if (!a.startsWith("-")) opts.path = a;
  }
  return opts;
}

const HELP = `wtfismyrepo — stop being lost in a codebase

Usage:
  wtfismyrepo [path]            Analyze a repo (default: current dir)

Options:
  --json            Emit machine-readable JSON (for the Claude skill/tooling)
  --no-history      Skip GitHub PR/issue fetch (offline / faster)
  --top N           Show top N ranked files (default 10)
  --no-color        Disable ANSI colors
  -h, --help        Show this help

What it does:
  Builds an import graph, runs PageRank to find the structurally central
  files, scores fragility from git churn, and pulls GitHub history (open PRs =
  hot zones, issues = pain). Then tells you exactly where to start.`;

function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.help) {
    console.log(HELP);
    return;
  }
  let analysis;
  try {
    analysis = analyze(opts.path, { history: opts.history, top: opts.top });
  } catch (err) {
    console.error("wtfismyrepo: analysis failed —", err.message);
    process.exit(1);
  }
  console.log(opts.json ? renderJSON(analysis) : renderText(analysis, { color: opts.color }));
}

main();
