# Install

wtfismyrepo is two things in one package: a **Claude Code skill** and a standalone **CLI / library**. Pick whichever you need.

## As a skill (recommended)

Install the skill so your agent loads it automatically:

```bash
# straight from GitHub — no npm account needed
npx github:nandnijaiswal/wtfismyrepo install
```

This copies `SKILL.md` into `~/.claude/skills/wtfismyrepo/`. Restart Claude Code, then ask *"wtf is this repo"*.

| Command | Effect |
|---|---|
| `... install` | Personal install (`~/.claude/skills/`) — all your projects |
| `... install --project` | Project-only install (`./.claude/skills/`) |
| `... install --force` | Overwrite an existing install |
| `... uninstall` | Remove the skill |

### Other agents (Cursor, Codex, Windsurf, …)

Any agent that reads a context file works — add this line to your `CLAUDE.md`, `AGENTS.md`, or `.cursorrules`:

```
@~/.claude/skills/wtfismyrepo/SKILL.md
```

Or copy `SKILL.md` into that agent's skills/instructions directory.

## As a CLI

```bash
# run once, no install
npx github:nandnijaiswal/wtfismyrepo .

# or clone + link
git clone https://github.com/nandnijaiswal/wtfismyrepo
cd wtfismyrepo && npm link
wtfismyrepo .
```

## As a library

```bash
npm install github:nandnijaiswal/wtfismyrepo
```

```ts
import { analyze, renderText } from "wtfismyrepo";

const report = analyze(".", { history: true, top: 10 });
console.log(renderText(report));
```

## Requirements

- **Node ≥ 18**
- **git** (for churn/fragility scoring — optional; the rest still works)
- **[`gh` CLI](https://cli.github.com/)** authenticated (for the PR/issue passes — optional)

> Once the package is published to npm, the `github:nandnijaiswal/` prefix can be dropped: `npx wtfismyrepo install`.
