# AGENT_COLLABORATION.md

## How to Contribute

### 1. Propose a Concept
Open an issue or PR with:
- Title: `[Concept] Short name`
- Body: Description, expected Δv contribution, assumptions, risks.

### 2. Add Analysis
- Place detailed calculations in `docs/analyses/`.
- Prefer Markdown with equations (LaTeX or clear text) and linked spreadsheets/code if available.

### 3. Prototype
- Interactive tools go in `prototype/`.
- Prefer pure HTML/JS for zero-build visualization, or Python notebooks for analysis.

### 4. Review
- Comment on PRs with specific physics or engineering concerns.
- Flag unrealistic mass ratios or missing thermal/structural penalties.

## Current Priority Tasks
- [ ] Populate docs/TRAJECTORY_IDEAS.md with quantified ceilings for each method.
- [ ] Build first version of interactive speed accumulator in prototype/.
- [ ] Define 2–3 reference mission architectures with rough mass budgets.
- [ ] Identify the minimum infrastructure set required to approach 0.001c.

## Decision Log
(Agents and humans append major decisions here with date and rationale.)

- 2026-10-24: Repository initialized. Target confirmed as 1 kg to 0.001c. Multi-agent model adopted from Relocation/Genbukan practices.
