#!/usr/bin/env node
/**
 * wtfismyrepo CLI — point it at a repo and it tells you what's going on.
 *
 *   wtfismyrepo [path] [--json] [--no-history] [--top N] [--no-color]
 */
import { analyze } from "../src/analyze.mjs";
import { renderText, renderJSON } from "../src/report.mjs";
import { installSkill, manualHelp } from "../src/install.mjs";

function parseArgs(argv) {
  const opts = { command: "analyze", path: ".", json: false, history: true, top: 10, color: true, target: "global", force: false };
  const rest = [...argv];
  // First non-flag token may be a subcommand.
  if (rest[0] === "install" || rest[0] === "uninstall") {
    opts.command = rest.shift();
  }
  for (let i = 0; i < rest.length; i++) {
    const a = rest[i];
    if (a === "--json") opts.json = true;
    else if (a === "--no-history") opts.history = false;
    else if (a === "--no-color") opts.color = false;
    else if (a === "--top") opts.top = parseInt(rest[++i], 10) || 10;
    else if (a === "--project") opts.target = "project";
    else if (a === "--global") opts.target = "global";
    else if (a === "--force") opts.force = true;
    else if (a === "-h" || a === "--help") opts.help = true;
    else if (!a.startsWith("-")) opts.path = a;
  }
  return opts;
}

const HELP = `wtfismyrepo — stop being lost in a codebase

Usage:
  wtfismyrepo [path]            Analyze a repo (default: current dir)
  wtfismyrepo install          Install as a Claude Code skill
  wtfismyrepo uninstall        Remove the installed skill

Analyze options:
  --json            Emit machine-readable JSON (for the Claude skill/tooling)
  --no-history      Skip GitHub PR/issue fetch (offline / faster)
  --top N           Show top N ranked files (default 10)
  --no-color        Disable ANSI colors

Install options:
  --global          Install for all your projects (~/.claude/skills) [default]
  --project         Install into ./.claude/skills for this repo only
  --force           Overwrite an existing install

What it does:
  Builds an import graph, runs PageRank to find the structurally central
  files, scores fragility from git churn, and pulls GitHub history (open PRs =
  hot zones, issues = pain). Then tells you exactly where to start.`;

function runInstall(opts) {
  const res = installSkill({ target: opts.target, force: opts.force });
  console.log(res.message);
  if (!res.installed && !res.dest) {
    console.log("\n" + manualHelp());
    process.exit(1);
  }
}

function runUninstall(opts) {
  // Lazy import to keep the hot path light.
  import("node:fs").then((fs) => import("node:os").then((os) => import("node:path").then((path) => {
    const base = opts.target === "project"
      ? path.join(process.cwd(), ".claude", "skills", "wtfismyrepo")
      : path.join(os.homedir(), ".claude", "skills", "wtfismyrepo");
    if (fs.existsSync(base)) {
      fs.rmSync(base, { recursive: true, force: true });
      console.log(`🗑️  Removed wtfismyrepo skill from ${base}`);
    } else {
      console.log(`Nothing to remove at ${base}`);
    }
  })));
}

function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.help) {
    console.log(HELP);
    return;
  }
  if (opts.command === "install") return runInstall(opts);
  if (opts.command === "uninstall") return runUninstall(opts);
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
