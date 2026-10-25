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

## Round 7 (2026-10-24): narratives, Voyager, exotic concepts, layout

| PR | Agent | Task | Correct (10) | Autonomy (10) | Quality (10) | Total | Notes |
|----|-------|------|---|---|---|---|-------|
| #44 | Codex (gpt-6.1-sol high, full-access) | Voyager 1/2 baselines, sort by v∞, preselect fastest | 10 | 10 | 9 | 29 | Sourced; example removed from the picker |
| #45 | Antigravity (gemini-4-argon-high) | narratives.json (data only) | 10 | 10 | 8 | 28 | Within word limits; grounded in the reference docs |
| #47 | Codex | narrative panel UI | 10 | 10 | 10 | 30 | Intro + scenario + per-leg event text; readable at 460px |
| #48 | Codex | Concept D laserCavityBoost | 10 | 10 | 9 | 29 | Matches ideas_calc.py; exotic metadata |
| #49 | Codex | Concept E ionDrive | 10 | 10 | 9 | 29 | 316.8 km/s Δv |
| #50 | Codex | Concept F pelletStream | 10 | 10 | 9 | 29 | 317.7 km/s |
| #51 | Codex | mobile-first layout pass | 10 | 10 | 9 | 29 | Advanced <details>; collapsible cards |

Process notes: a driver script ran D→E→F→layout sequentially on fresh main, merging each only after `gh pr checks --watch` was green.

Round 7 review adjustments (coordinator code review of #48–#51): the physics matches ideas_calc.py, but #48 lacked ideas_calc's Doppler cap on the recycling factor and #48–#50 duplicated their validation (fixed in #56), so #48: 29→28. #51 put the 3D viewer at the bottom on mobile (fixed in #55), so #51: 29→26.

| PR | Agent | Task | Correct (10) | Autonomy (10) | Quality (10) | Total | Notes |
|----|-------|------|---|---|---|---|-------|
| #55 | Codex | mobile viewer placement + card-default tests | 10 | 10 | 10 | 30 | 45vh viewer under the headline; verified real-width shots |
| #56 | Codex | exotic handler review follow-ups | 10 | 10 | 10 | 30 | Doppler cap enforced; shared validators |

| PR | Agent | Task | Correct (10) | Autonomy (10) | Quality (10) | Total | Notes |
|----|-------|------|---|---|---|---|-------|
| #61 | Codex (gpt-6.1-sol high, full-access) | Concept F pellet material + narrative | 10 | 10 | 10 | 30 | 7 materials; Al recommended; spot-checked d, ionisation, gyroradius; honest ram-vs-magnetic-pressure caveat; 6 tests |

## Round 8 (2026-10-25): physics deep dives

| PR | Agent | Task | Correct (10) | Autonomy (10) | Quality (10) | Total | Notes |
|----|-------|------|---|---|---|---|-------|
| #64 | Codex (gpt-6.1-sol high, full-access) | full-story collapsible card | 10 | 10 | 10 | 30 | Shared disclosure card; mobile collapsed |
| #67 | Codex | Concept F ionisation beam + magnetic reflection | 10 | 10 | 10 | 30 | Caught the coordinator's 5 kJ/g error (really 5 MJ/g); coil 0.76–2.1 MA, 4–12 t |
| #68 | Codex | EM rail limits | 10 | 10 | 10 | 30 | Lengths spot-checked; verdict: 2.5–5 km/s lunar coilgun |
| #70 | Codex | Great Comet 1843 hitchhike | 10 | 10 | 10 | 30 | Exact 74.535 km/s burn; independently confirmed |
| #72 | Codex | Orion + sundiver sail, Concept G | 10 | 10 | 10 | 30 | Corrected β: 0.708 for a parabolic dive vs 1.708 from rest; checked |
| #75 | Codex | Nano-swarm analysis + claims check, Concept H | 10 | 10 | 10 | 30 | Picked up the mid-run claims addendum; Airy radius and accel spot-checked; magsail 0.2c→41 yr, 1,906 t |
