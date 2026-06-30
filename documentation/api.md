# CLI & API reference

## CLI

```bash
wtfismyrepo [path] [options]
wtfismyrepo install [--global|--project] [--force]
wtfismyrepo uninstall [--global|--project]
```

| Option | Default | Description |
|---|---|---|
| `path` | `.` | Repo directory to analyze |
| `--json` | off | Emit machine-readable JSON (what the skill consumes) |
| `--no-history` | off | Skip the GitHub PR/issue fetch (offline / faster) |
| `--top N` | `10` | Show the top N ranked files |
| `--no-color` | off | Disable ANSI colors |
| `-h, --help` | — | Show help |

### Examples

```bash
wtfismyrepo .                      # full onboarding report for the current repo
wtfismyrepo ../some-service --json # JSON, for piping into other tooling
wtfismyrepo . --no-history --top 5 # offline, just the top 5 central/fragile files
```

## Library

```ts
import { analyze, renderText, renderJSON, pageRank } from "wtfismyrepo";
```

### `analyze(cwd, opts?) → Analysis`

| Option | Type | Default | Description |
|---|---|---|---|
| `history` | `boolean` | `true` | Fetch GitHub PR/issue data via `gh` |
| `top` | `number` | `10` | How many ranked files to keep |

The returned `Analysis` object:

```ts
{
  cwd: string,
  stack: { manifests, languages, ecosystems },
  pkg: { name?, description?, scripts: string[] },
  hasReadme: boolean,
  counts: { files, sourceFiles, edges, isGit },
  topLevel: { dir, count }[],          // top-level layout
  entryPoints: { file, weight, why }[],// where execution starts
  importance: { file, score, rank }[], // the spine (PageRank)
  fragility: { file, score, centrality, churn }[],
  hotZones: { file, prs: number[] }[], // files under open PRs
  history: { available, openPRs, mergedPRs, openIssues, goodFirstIssues }
}
```

### `renderText(analysis, { color? }) → string`
Human-readable terminal report.

### `renderJSON(analysis) → string`
Pretty-printed JSON.

### `pageRank(graph, opts?) → Map<string, number>`
The raw algorithm, if you want to rank your own `Map<node, Set<node>>` graph. Options: `damping` (0.85), `epsilon` (1e-8), `maxIter` (200).
