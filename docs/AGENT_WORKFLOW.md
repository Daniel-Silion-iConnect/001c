# AGENT_WORKFLOW.md

Multi-agent coordination for the 001c project.

## Dedicated Bot
The **001c** Grok Bot is the coordinator. It keeps project context, triages the backlog, suggests assignments, and can run status checks.

## Backlog Model
- **GitHub Issues** are the source of truth for the backlog.
- Each issue has a clear scope, acceptance criteria, and (when assigned) an agent owner.
- Agents work in their own **git worktrees** (or branches) and open **PRs**.
- The 001c bot helps prioritize, review status, and propose next issues.

## Agent Types
- Claude Code / Claude CLI (preferred for local or bot-machine execution when available)
- Codex, Gemini, and other coding agents via their CLIs or manual handoff
- Human review on all PRs before merge

## Current Setup Status
- Spacekit.js prototype skeleton is in `prototype/spacekit/`.
- Orbital notation and event schema are documented in `docs/ORBITAL_NOTATION.md` and `docs/DECISIONS.md`.
- First issues to open: real orbital engine implementation, schema-driven trajectory loading in spacekit, Oberth modeling, etc.

## Inspiration
Relocation and Robinhood repos for issue hygiene, clear agent instructions, and PR workflow.

See also `AGENTS.md` and `AGENT_COLLABORATION.md`.
