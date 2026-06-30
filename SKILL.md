---
name: wtfismyrepo
description: Onboarding companion that explains an unfamiliar codebase to a developer who just got dropped into it. Use this skill whenever someone is new to a repo, lost in a codebase, doing onboarding, or asks any of: "where do I start", "how does this work", "explain this repo", "what is going on here", "I'm new to this codebase", "walk me through", "give me a tour", "where is X handled", "what breaks if I touch this", "what should I work on first", "how do I run this", "what are the main parts", "trace this request", "onboard me", "ramp up", "understand this project". This skill reads the codebase AND its GitHub history (open PRs, closed PRs, active issues) to reconstruct intent, then explains the system part-by-part at the developer's level. Trigger aggressively whenever confusion about an existing codebase is expressed.
---

# wtfismyrepo: Stop Being Lost in a Codebase

**Core principle**: A repo is not just code — it's the frozen output of hundreds of decisions. The code tells you *what* exists. The PRs, issues, and commit history tell you *why* it exists and *what hurts*. To truly understand a codebase, read both. Then explain it the way you'd want it explained to you on day one: concretely, in order, and at the right altitude.

This skill turns Claude into the senior engineer who sits next to a new dev and says: *"Okay, here's what this thing actually does, here's where to start reading, and here's the part everyone gets confused by."*

---

## When to Trigger This Skill

- A developer is **new to a repository** (open source, new job, inherited project)
- Someone says they are **lost, confused, or don't know where to start**
- A request to **explain, tour, walk through, or map** a codebase
- Questions like **"how does X work in this repo"** or **"where is Y handled"**
- Figuring out **what to work on first** (good-first-issue hunting)
- Understanding **blast radius**: "what breaks if I change this?"
- **Tracing a request/data flow** end to end through unfamiliar code

**Trigger keywords**: onboard, onboarding, ramp up, new to repo, lost, confused, where do I start, explain this repo, walk me through, give me a tour, how does this work, what is this, trace this, where is X handled, what breaks if, good first issue, understand the codebase, get up to speed.

---

## The Method: Six Passes

Do NOT dump the whole repo on the developer. Understanding is built in layers, from the outside in. Work these passes **in order**. Each pass produces output the developer can absorb before the next.

> **Tooling note**: This skill ships with a deterministic analysis engine — run it FIRST to get hard data, then use your judgment to explain it:
> ```bash
> npx wtfismyrepo . --json    # import-graph PageRank, fragility scores, hot zones, entry points
> ```
> The `--json` output gives you ranked central files (the spine), fragility scores (git-churn × centrality), entry points, and GitHub hot zones without guessing. Use it to ground every pass below. Then use the `gh` CLI for deeper PR/issue reading and file tools for the code itself. If `gh` is unavailable, say so and fall back to local git history (`git log`, `git blame`) — never silently skip the history passes; they are where the real understanding lives.

---

### Pass 1 — Recon: What even is this thing? (5 minutes)

Goal: one-paragraph answer to "what is this repo and what stack is it."

1. Read `README.md`, `CONTRIBUTING.md`, `docs/`, and any `ARCHITECTURE.md` / `DESIGN.md`.
2. Read the manifest(s): `package.json`, `pyproject.toml`, `go.mod`, `Cargo.toml`, `pom.xml`, `Gemfile`, etc. — these reveal language, framework, scripts, and dependencies.
3. Detect the project type (web app, CLI, library, service, monorepo) and how it's run/tested/built (the `scripts`/`Makefile`/CI config).
4. Note the license and rough size/activity (last commit, star count, open issue count via `gh repo view`).

**Deliverable to the dev**: 3–5 sentences — *"This is a `<type>` written in `<lang>` using `<framework>`. You run it with `<command>`. It does `<one-line purpose>`."*

---

### Pass 2 — The Map: Territory and entry points (10 minutes)

Goal: a mental map of the directory structure and where execution begins.

1. Generate a pruned directory tree (ignore `node_modules`, `vendor`, `dist`, `.git`, build artifacts).
2. Identify **entry points**: `main`, `index`, `app`, `cmd/`, server bootstrap, CLI root, the route table, or the framework's convention.
3. Label each top-level directory with its *responsibility* in one line ("`/api` — HTTP handlers", "`/core` — domain logic", "`/db` — persistence").
4. Find the **config and environment**: env vars, config files, feature flags, secrets handling.

**Deliverable to the dev**: An annotated tree + "Execution starts here → `path/to/entry`" + the 3–4 directories that matter most.

---

### Pass 3 — The Spine: Trace one real path end-to-end (15 minutes)

Goal: connect the boxes. Pick the single most representative flow (the primary HTTP request, the main CLI command, the core job) and trace it through every layer.

1. Start at the entry point, follow the call into routing → handler → business logic → data layer → response.
2. Name the key abstractions encountered (the central model, the service class, the main interface).
3. Note where state lives and what the source of truth is.

**Deliverable to the dev**: A numbered, file-linked trace — *"1. Request hits `routes.ts:42` → 2. dispatched to `UserController.create` → 3. validated in … → 4. persisted via …"*. This single trace teaches the architecture better than any diagram.

---

### Pass 4 — The History: Read the PRs and issues (15 minutes)

**This is the pass that makes this skill different.** Code shows the present; history shows the trajectory and the pain.

1. **Open PRs** (`gh pr list --state open`): What is *actively changing right now?* These are the hot zones — touching them risks merge conflicts and means the design is in flux. Summarize the themes.
2. **Recently merged PRs** (`gh pr list --state merged --limit 30`): How did the code get to its current shape? What patterns do reviewers enforce? Read 3–5 substantial ones to learn the team's conventions and review culture.
3. **Open issues** (`gh issue list --state open`): Where does it hurt? Bugs cluster in fragile modules. Feature requests reveal the roadmap. Labels like `good first issue` / `help wanted` are gold for a newcomer.
4. **Closed issues** for a target area: how were similar problems solved before? Avoid re-litigating settled decisions.

**Deliverable to the dev**: *"Hot zones (avoid surprising people): … . Fragile areas (bugs cluster here): … . The team cares about: … . Good place for you to start: issue #NNN."*

---

### Pass 5 — The Explanation: Part-by-part, at their level (ongoing)

Now teach. Calibrate to the developer — ask their experience level and goal if unknown ("fixing a bug? adding a feature? just understanding?").

Rules for explaining:
- **One part at a time.** Never dump. Explain a component, check understanding, then go deeper or move on.
- **Always link to real files** (`path/to/file.ext:line`) so they can read along.
- **Use analogies for unfamiliar patterns**, but ground every analogy back in the actual code.
- **Explain the "why," not just the "what"** — pull the reasoning from the PR/issue history found in Pass 4.
- **Surface the traps**: the counterintuitive bits, the "looks unused but isn't," the global that everything depends on.

---

### Pass 6 — The Launchpad: Where do YOU start? (the payoff)

End every onboarding with a concrete, personalized next action:

1. **A first file to read** to go one level deeper than the tour.
2. **A first safe change** — a low-blast-radius `good first issue` or a tiny improvement, with the exact files involved.
3. **The blast-radius warning**: "Before you touch `X`, know that `A`, `B`, and `C` depend on it."
4. **Who/what to ask** — the CODEOWNERS, the most active reviewer, the relevant doc.

**Deliverable**: A short, confidence-building "Your first move" section. The dev should close the session knowing *exactly* what to do next instead of staring at the file tree.

---

## Anti-Patterns (do NOT do these)

- ❌ **Dumping the entire structure** in one giant message. Layer it.
- ❌ **Explaining code without history.** A function's *why* lives in its PR, not its body.
- ❌ **Generic explanations** that could apply to any repo. Always cite this repo's actual files and decisions.
- ❌ **Skipping the "where do I start"** payoff. A lost dev needs a first step, not a lecture.
- ❌ **Assuming the README is current.** Verify claims against the code; flag drift.

---

## Quick Command Reference

```bash
# Recon
gh repo view --json name,description,languages,stargazerCount,updatedAt
cat README.md package.json   # or pyproject.toml / go.mod / Cargo.toml

# Map
git ls-files | head -100      # tracked files, ignores build junk

# History (the secret sauce)
gh pr list --state open --limit 30
gh pr list --state merged --limit 30
gh issue list --state open --label "good first issue"
gh issue list --state open --label "bug"

# Blast radius for a file/symbol
git log --oneline -- path/to/file       # how often it changes
grep -rn "SymbolName" --include=*.ext .  # who depends on it
```

---

## The One-Liner That Should Always Be Answerable

After running this skill, the developer should be able to finish these three sentences about the repo:

1. **"This system exists to ______, and it works by ______."**
2. **"If I need to change ______, I start in `______` and watch out for ______."**
3. **"The riskiest/most fragile part of this codebase is ______, because ______."**

If they can't, you haven't finished. Go deeper.
