# How it works

wtfismyrepo turns "I'm lost in this repo" into hard data, then a guided explanation. The CLI does the deterministic analysis; the [skill](../SKILL.md) layers a human-friendly, part-by-part walkthrough on top.

## The pipeline

```
 files ─► import parser ─► directed import graph ─► PageRank ──┐
                                                               ├─► importance ranking (the spine)
   git log ───────────────► per-file churn ───────────────────┤
                                                               └─► fragility = centrality × churn
   gh CLI ──► open PRs (hot zones) + issues (pain) ──────────────► where to start
```

### 1. Scan (`src/scan.mjs`)
Lists git-tracked files (so `.gitignore` is respected), then reads only the parseable source files (JS/TS/JSX/Python/Go), skipping anything over 1 MB to avoid minified/generated noise.

### 2. Build the import graph (`src/graph.mjs`)
Each source file is parsed for real `import` / `require` / `from` statements. Specifiers are **resolved to internal repo files** — relative paths for JS/TS (with `index` and extension resolution), dotted relative packages for Python, suffix-matched directories for Go. External/library imports are dropped: we only care about internal coupling.

The result is a directed graph where an edge `A → B` means "A imports B".

### 3. PageRank (`src/pagerank.mjs`)
We run classic power-iteration PageRank over that graph (damping 0.85, dangling-node redistribution, L1 convergence). A file's rank is high when many files — especially other important files — depend on it. **High rank = the spine of the system; read these first.**

### 4. Churn (`src/git.mjs`)
`git log` gives a change-frequency count per file. Frequently changed files are where the action — and the risk — is.

### 5. Fragility (`src/fragility.mjs`)
Centrality and churn are each min-max normalized to `[0,1]` and multiplied:

```
fragility(file) = centrality(file) × churn(file)
```

A file that is **both** load-bearing **and** constantly changing is the one most likely to bite you. Pure-churn files with no centrality are filtered out.

### 6. GitHub history (`src/history.mjs`)
Via the `gh` CLI (best-effort, degrades gracefully if missing):
- **Open PRs** → mapped to the files they touch = *hot zones* (editing them risks conflicts).
- **Merged PRs** → the team's conventions.
- **Open issues** → where it hurts; `good first issue` labels = where you start.

### 7. Report (`src/report.mjs`)
Everything is assembled into a terminal report — or `--json` for the skill/other tooling — that ends with a concrete **"Your first move."**

## The explanation layer: the ADHD engine

Steps 1–7 produce *data*. Turning data into a good explanation is a separate, harder problem — and the naive approach (one linear summary) anchors on whatever angle it starts with.

wtfismyrepo's `explain` command and skill use the **[ADHD](https://github.com/UditAkhourii/adhd) divergent-ideation engine** (MIT, by Udit Akhouri) for this. The analysis object is formatted by [`src/explain.mjs`](../src/explain.mjs) into an ADHD `problem` + `context`:

- **problem**: *"How should I explain and onboard a developer onto `<repo>`?"* (plus their level + goal)
- **context**: the full structural intelligence — entry points, spine, fragility, hot zones, issues

ADHD then runs its loop:

1. **Diverge** — generate onboarding angles in parallel under different cognitive frames ([`src/onboarding-frames.mjs`](../src/onboarding-frames.mjs): new-grad, archeologist, security-researcher, on-call-at-3am, refactorer, inversion…). No cross-talk, so no premature convergence.
2. **Score** — each angle rated on novelty / viability / fit; traps (angles that look helpful but waste time) flagged.
3. **Cluster** — group surviving angles by underlying approach.
4. **Deepen** — expand the non-obvious best angle into a full walkthrough grounded in the real files.

If `adhd-agent` is installed, `wtfismyrepo explain` runs this for real; otherwise it prints the formatted ADHD prompt. The [SKILL.md](../SKILL.md) runs the identical loop with Claude itself as the generator and critic — so the skill works with zero extra dependencies.

## Why the skill matters too

The CLI gives Claude ground-truth instead of guesses. The skill then runs the ADHD diverge→score→deepen loop to pick the *best* explanation angle for the specific developer, and delivers it **one layer at a time**, citing real files — instead of dumping the whole tree at once.
