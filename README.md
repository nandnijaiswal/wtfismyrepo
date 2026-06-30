# wtfismyrepo 🤯

> **You just got dropped into a 200k-line codebase. You have no idea what's going on. This fixes that.**

A **CLI tool + [Claude Code](https://claude.com/claude-code) skill** that onboards you onto *any* repository — open source or the legacy monster you inherited at your new job. It doesn't just read the code; it builds an **import graph**, runs **PageRank** to find the files that hold the system together, scores **fragility** from git churn, and reads the **GitHub history** (open PRs, merged PRs, issues) to show you the danger zones and tell you **exactly where to start**.

[![CI](https://github.com/nandnijaiswal/wtfismyrepo/actions/workflows/ci.yml/badge.svg)](https://github.com/nandnijaiswal/wtfismyrepo/actions/workflows/ci.yml)
![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)

We've all been there. New repo. `README` three years out of date. 47 top-level folders. You don't know where execution starts, what's safe to touch, or what you're even supposed to work on. So you stare at it and quietly panic.

**wtfismyrepo** is the senior engineer who pulls up a chair and says: *"Relax. Here's what this thing does, here's the spine, here's the part that bites people, and here's your first move."*

---

## Quick start

```bash
npx wtfismyrepo          # run it on the repo you're standing in
# or install it
npm install -g wtfismyrepo
wtfismyrepo .
```

```
wtfismyrepo [path] [--json] [--no-history] [--top N] [--no-color]
```

| Flag | Effect |
|------|--------|
| `--json` | Machine-readable output (what the Claude skill consumes) |
| `--no-history` | Skip the GitHub PR/issue fetch (offline / faster) |
| `--top N` | Show top N ranked files (default 10) |

Requires **Node ≥ 18**. The GitHub passes use the [`gh` CLI](https://cli.github.com/) if it's authenticated; without it, everything else still works.

---

## What makes it different: it reads the *history*, not just the code

Code only tells you **what** exists. The **why** — and the **landmines** — live in the history and the structure:

- 🧭 **PageRank on the import graph** → the structurally *central* files. Read these first; everything depends on them.
- ⚠️ **Fragility = centrality × git churn** → the files that are both load-bearing *and* constantly changing. These are the ones that bite you.
- 🔥 **Open PRs** → the *hot zones* changing right now. Edit them and you'll fight merge conflicts and surprise people.
- 🩹 **Open issues** → where it hurts. Bugs cluster in the fragile modules.
- 🌱 **`good first issue` labels** → exactly where *you* should start.

---

## The algorithm

```
 files ─► import parser ─► directed import graph ─► PageRank ──┐
                                                               ├─► importance ranking
   git log ───────────────► per-file churn ───────────────────┤
                                                               └─► fragility = centrality × churn
   gh CLI ──► open PRs (hot zones) + issues (pain) ──────────────► where to start
```

1. **Scan** — list git-tracked files (respects `.gitignore`), read parseable sources.
2. **Graph** — parse real `import` / `require` / `from` statements (JS, TS, JSX, Python, Go), resolve them to internal files, build a directed graph of who-depends-on-whom.
3. **PageRank** — power-iteration with damping + dangling-node handling; converges on any graph shape. High rank = structurally central = read-this-first.
4. **Churn** — `git log` change-frequency per file.
5. **Fragility** — normalize centrality and churn to `[0,1]`, multiply. Central **and** churned = handle with care.
6. **History** — `gh` pulls open PRs (mapped to the files they touch = hot zones), merged PRs (conventions), and issues (pain + good-first-issues).
7. **Report** — a terminal report (or `--json`) ending in a concrete **"Your first move."**

It's [tested](test/) (unit tests on the PageRank, graph parsing, and scoring) and runs in CI on Node 18/20/22.

---

## Use it as a Claude Code skill

The CLI does the deterministic heavy lifting; [`SKILL.md`](SKILL.md) teaches Claude how to turn that output into a guided, part-by-part walkthrough at *your* level.

```bash
echo "@/path/to/wtfismyrepo/SKILL.md" >> CLAUDE.md
```

Then just ask Claude Code:

> *"wtf is this repo"* · *"I'm new here, where do I start?"* · *"walk me through how auth works"* · *"what breaks if I touch the payments module?"*

Claude runs `wtfismyrepo --json` for hard data, then explains it layer by layer instead of dumping the whole tree on you.

---

## Project layout

```
bin/wtfismyrepo.mjs   CLI entry
src/
  analyze.mjs         orchestrator
  scan.mjs            file discovery + source reading
  graph.mjs           import parsing + resolution
  pagerank.mjs        the PageRank algorithm
  git.mjs             churn + tracked files
  fragility.mjs       importance + fragility scoring
  entrypoints.mjs     entry-point detection
  history.mjs         gh PR/issue signals
  report.mjs          terminal + JSON rendering
SKILL.md              the Claude Code skill
test/                 unit tests
```

---

## License

MIT © [Nandni Jaiswal](https://github.com/nandnijaiswal) — go forth and stop being lost.
