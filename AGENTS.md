# AGENTS.md

## 001c Bot
A dedicated Grok Bot named **001c** coordinates this project. It owns backlog triage, multi-agent task suggestion, and status tracking.

## How Agents Contribute
1. Pick or get assigned a GitHub issue.
2. Work in a dedicated worktree or branch.
3. Follow the orbital notation schema in `docs/ORBITAL_NOTATION.md`.
4. Open a PR with a clear description linking the issue.
5. Human (or bot-assisted) review before merge.

## Preferred Tools
- Claude Code / Claude CLI when installable on the coordinating machine.
- Other coding agents (Codex, Gemini, etc.) via CLI or prompt handoff.
- All changes go through GitHub PRs.

## Key Docs
- `docs/DECISIONS.md` — stack and notation decisions
- `docs/ORBITAL_NOTATION.md` — Keplerian / Cartesian schema
- `docs/AGENT_WORKFLOW.md` — full coordination model
- `prototype/spacekit/` — current visualization skeleton
