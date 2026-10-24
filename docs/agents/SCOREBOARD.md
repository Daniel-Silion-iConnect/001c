# Agent Aptitude Scoreboard

Scored by the 001c coordinator after reviewing each PR. 1–5 per axis: correctness, scope adherence, code quality, tests, PR hygiene, autonomy (5 = no help needed). Total /30.

| Date | Issue | PR | Agent | Model / effort | Corr | Scope | Quality | Tests | Hygiene | Autonomy | Total | Wall time | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 2026-10-24 | #2 | #8 | claude | claude-opus-5-5 / high | 5 | 5 | 5 | 5 | 5 | 5 | 30 | ~6 min | Physics hand-checked exact; honest sample result; flagged design choices |
| 2026-10-24 | #1 | #10 | codex | gpt-6.1-sol / medium | 5 | 5 | 4 | 5 | 3 | 2 | 24 | ~8 min | Strong schema + 52 tests; sandbox blocked git/network → coordinator pushed & opened PR |
| 2026-10-24 | #5 | #9 | antigravity | gemini-4-argon-medium | 4 | 5 | 4 | 3 | 4 | 5 | 25 | ~8 min | Math correct; linear tether addition & speculative tether chain under-flagged; some refs lack links; docs only (no tests expected) |
| 2026-10-24 | #6 | #7 | grok (self) | 001c coordinator | 4 | 5 | 4 | 3 | 5 | 5 | 26 | ~5 min | Self-scored; CI first pushed with missing ajv-formats, fixed |

## Round 1/2 (2026-10-24)

| PR | Agent | Task | Correct (10) | Autonomy (10) | Quality (10) | Total | Notes |
|----|-------|------|---|---|---|---|-------|
| #11 | Claude (opus-5-5 high) | gravityAssist + tetherRelease | 10 | 8 | 10 | 28 | 11 engine + 14 schema tests; contract changes flagged; base needed retarget |
| #9 (rev) | Antigravity (gemini-4-argon) | scenario doc revision | 8 | 9 | 8 | 25 | DOIs added, speculative flags, ~10 min |
| #12 | Codex (gpt-6.1-sol high) | viz wiring + Pages deploy | 9 | 6 | 9 | 24 | Strong viewer; sandbox required manual import; broke on #11 optional turnAngle |

Live viewer: https://daniel-silion-iconnect.github.io/001c/
