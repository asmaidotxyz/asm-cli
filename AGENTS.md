# AGENTS.md

## Project overview

`asm` (Agent Skills Manager) — a Bun-compiled CLI that helps AI agents install skills into user projects. Two commands:

- **`setup`** — detects installed agents on user machine, writes custom instructions to each agent's config telling them to use `asm` for learning skills. (Currently a stub.)
- **`learn <topic>`** — called by an agent at runtime; searches the remote API for a matching skill and installs it into `.agents/skills/<name>/` in the current working directory.

## Build & run

```bash
bun install
bun run build        # compiles to standalone binary: build/asm
bun run dev          # build --watch
bun run index.ts     # run directly without compiling
```

There are **no tests, linter, or formatter** configured yet.

## Architecture

```
index.ts              — CLI entrypoint (commander)
handlers/             — one file per command (*setup.handler.ts*, *learn.handler.ts*)
services/
  agent.service.ts    — checks if an agent config file exists in $HOME
  install.service.ts  — clones/fetches a skill repo and copies the skill folder to .agents/skills/
  setup.service.ts    — (empty barrel)
constants/index.ts    — VERSION, API_ENDPOINT, AGENT_FILE_LOCATION
types/index.ts        — Skill type
```

## Key details an agent would miss

- **Runtime is Bun**, not Node. Use `Bun.*` APIs (e.g. `Bun.spawn`, `Bun.file`) and `bun build --compile` for the binary.
- **API endpoint** defaults to `https://asmai.xyz/api` but can be overridden with `ASM_API_ENDPOINT` env var.
- The learn handler hits `/api/search?query=<topic>` (note: the constant already has `/api` in the base, so the actual call is `${API_ENDPOINT}/api/search` — double `/api`). This may be intentional or a bug worth verifying.
- Skills are installed to `<cwd>/.agents/skills/<sanitized-name>/` via git clone (preferred) or GitHub API fallback.
- A skill is identified by a `SKILL.md` file with YAML frontmatter containing a `name:` field.
- Agent config file detection uses `$HOME/<relative-path>` (see `AGENT_FILE_LOCATION` in constants).
- `setup` handler is currently an empty stub — not yet implemented.
- `INSTRUCTION.md` at repo root is a placeholder template for the content written into agent config files during setup.
