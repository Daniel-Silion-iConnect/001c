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

## Round 3/4 (2026-10-24)

| PR | Agent | Task | Correct (10) | Autonomy (10) | Quality (10) | Total | Notes |
|----|-------|------|---|---|---|---|-------|
| #17 | Codex (gpt-6.1-sol high, danger-full-access) | probe playback + time scrub | 10 | 10 | 10 | 30 | Kepler/Barker propagation with tests; claimed, pushed and opened the PR itself (~4 min) |
| #20 | Antigravity (claude-opus-5-5-medium spillover) | scenarios A/B/C + picker | 10 | 9 | 10 | 29 | Reproduces the doc to ±0.01 km/s; found a Concept B table error (45.07, not 48.20) |
| #19 | Codex (gpt-6.1-sol high, danger-full-access) | speed chart + gap to 300 km/s | 9 | 10 | 9 | 28 | Localised edits; merged cleanly |
| #21 | Antigravity (gemini-4-argon-high) | favicon + visual polish | 7 | 3 | 7 | 17 | Good edits but stalled before committing (~20 min); coordinator committed it, Codex resolved the rebase |

Process notes: Codex `--sandbox danger-full-access` inside a worktree fixes the push problem. The agy CLI needs `--model … -p "prompt"` (the prompt must come last).

## Round 5 (2026-10-24)

| PR | Agent | Task | Correct (10) | Autonomy (10) | Quality (10) | Total | Notes |
|----|-------|------|---|---|---|---|-------|
| #26 | Antigravity (gemini-4-argon-medium) | §6 Concept B doc fix | 10 | 10 | 9 | 29 | Docs-only task; autonomous, ~2 min |
| #27 | Codex (gpt-6.1-sol high, full-access) | solarSail event + Concept B | 10 | 10 | 10 | 30 | μ(1−β) propagation; reproduces 107.56 km/s hybrid; jettison work handled |
| #28 | Antigravity (opus spillover) → Codex | continuous arcs + mobile labels | 9 | 7 | 9 | 25 | Opus hit its quota (429) after the helpers/tests; Codex finished it with mobile-readable labels |

Process notes: Antigravity's opus quota ran out after ~2 tasks (reset ~4.5 h). Codex full-access remains the most reliable coder.

## Round 6 (2026-10-24)

| PR | Agent | Task | Correct (10) | Autonomy (10) | Quality (10) | Total | Notes |
|----|-------|------|---|---|---|---|-------|
| #31 | Codex (gpt-6.1-sol high, full-access) | travel-time panel | 10 | 10 | 10 | 30 | Constants and spot checks correct; mobile-readable; sources doc; ~5 min |
| #34 | Codex (gpt-6.1-sol high, full-access) | ring-anchored labels + friendly times | 10 | 10 | 9 | 29 | Leader-line labels; "12,000 yr" format; ~6 min |

## Brainstorm: exotic propulsion (issue #35, 2026-10-24)

Scored on creativity (10) and numerical accuracy (10), checked by `analysis/ideas_calc.py`.

| Agent (model) | Ideas | Creativity (10) | Accuracy (10) | Total (20) | Notes |
|---|---|---|---|---|---|
| Claude (claude-opus-5-5 medium) | Photon-recycling cavity catapult (307 km/s); Po-210 direct-charge ion drive (317 km/s Δv); lunar-anchor add-on | 9 | 10 | 19 | Every number within 1%; candid showstoppers; best lunar add-on (≥560 t recoil anchor saved) |
| Codex (gpt-6.1-sol high) | Chirped pellet slipstream (318); solar-wind bank shot (371) | 9 | 9 | 18 | Clean derivations with sources; pellet energy 150 vs 131 GJ (−13%) |
| Antigravity (gemini-4-argon-medium) | FFRE perihelion burn (241); coronal laser ablation (240/299); MagLIF kicker (claimed 312); 3 lunar add-ons | 8 | 4 | 12 | Prolific and inventive, but MagLIF v_e off ×32, perigee-dive gain +28%, unphysical inbound v∞, missed a 7 km aperture; riff gains unverifiable |
