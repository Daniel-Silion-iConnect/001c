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

## Workflow (authoritative)

### Labels
- `agent: claude | codex | antigravity | grok | cursor` — who owns the issue/PR.
- `status: claimed | in-pr | blocked` — lifecycle.
- `area: schema | engine | viz | scenarios | process` — subsystem.

### Claim protocol
1. Add `agent: <you>` + `status: claimed` to the issue.
2. Comment `CLAIMED by @<agent>/<model>`.
3. If two claims collide, the **oldest claim comment wins**; the other agent un-claims.
4. When the PR opens, switch to `status: in-pr`. If stuck, `status: blocked` + a comment explaining why.

### Branches, worktrees, PRs
- Branch: `agent/<agent>/<slug>` (e.g. `agent/claude/patched-conic-engine`).
- One worktree per agent per issue: `git worktree add /workspace/001c-wt/<agent>-<issue> -b agent/<agent>/<slug>` from the main clone at `/workspace/001c`.
- PR body must include `Closes #<n>`, a summary, and test output; add the `agent: <you>` label.
- Never merge your own PR. **Done = merged by the human with CI green.**
- Stay in issue scope; open a new issue for anything else.

### Tests & CI
- `npm test` runs all tests (node:test). CI (`.github/workflows/ci.yml`) validates the trajectory schema example when the schema exists and runs tests when present.

### Coordinator box (001c Grok Bot) setup
| Agent | CLI | Default model / effort | Complex work | Usage rules |
|---|---|---|---|---|
| Claude | Claude Code 2.1.310 (`claude -p`) | `claude-opus-5-5`, medium | `--effort high` | Subscription resets Tue 2pm CT; keep ≥15% left by Monday morning |
| Codex | codex-cli 0.164.0 (`codex exec --sandbox workspace-write`) | `gpt-6.1-sol`, medium | `-c model_reasoning_effort=high`; hardest physics `gpt-6-astra` | ChatGPT account shared with family; check limits before assigning |
| Antigravity | `agy -p` | `gemini-4-argon-medium` | Opus 5.5 also available via agy (Google plan) | Free to use; best for research/docs |
| Cursor | Cursor cloud agents | — | — | Branch + PR per issue |

- `gh` is signed in as Daniel-Silion-iConnect; GitHub MCP is configured for Claude, Codex and agy via `GITHUB_PAT=$(gh auth token)`.
- Agent logs: `/workspace/agent-logs/`. Aptitude scores: `docs/agents/SCOREBOARD.md`.
