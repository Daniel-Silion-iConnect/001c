# 001c — 1 kg Probe to 0.001c

**Goal:** Deliver a 1 kilogram probe to an asymptotic heliocentric escape speed of **0.001c** (~300 km/s, ~63 AU/yr) using near-term chemical systems, orbital infrastructure, solar Oberth maneuvers, momentum-exchange tethers, and opportunistic hitchhike boosts.

This repository is a multi-agent collaborative design space. Agents (Grok, Claude, Gemini, Codex, etc.) contribute analyses, trajectory concepts, mass budgets, and prototypes. Humans decide and integrate.

## Quick Links
- [GOAL.md](GOAL.md) — Mission objective and success criteria
- [SPECS.md](SPECS.md) — Requirements and constraints
- [DESIGN.md](DESIGN.md) — Architecture and concept of operations
- [AGENTS.md](AGENTS.md) — How agents collaborate
- [AGENT_COLLABORATION.md](AGENT_COLLABORATION.md) — Contribution protocol
- [docs/TRAJECTORY_IDEAS.md](docs/TRAJECTORY_IDEAS.md) — Catalog of boost methods
- [prototype/](prototype/) — Interactive speed visualizer (WIP)

## Status
Early design phase. Target is aggressive; pure chemical alone cannot reach 0.001c. Infrastructure (tether chains, refueling, beamed energy options) is required.

The viewer keeps Concept F as the default fastest kilogram-class concept (2 kg
modeled probe), while sorting all options fastest first and showing trip times.
Concept I adds separate gram-scale laser-sail comparisons: a 0.2c Proxima flyby
(~21.2 yr) and a conditional 0.046c Alpha Cen A capture study (~95 yr arrival
scale). These exceed the target and are not 1 kg probes. See the
[viewer README](prototype/spacekit/README.md#concept-i-laser-sail-starshot-class)
for modeling limits and the default-selection rationale.

## Inspiration
Structure and multi-agent practices drawn from the Relocation, Genbukan, and Robinhood repositories.

**Let's make this happen.**
