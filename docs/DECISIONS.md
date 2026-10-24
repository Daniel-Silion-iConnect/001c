# DECISIONS.md — Architecture & Notation Decisions

## 2026-10-24: Visualization & Computation Stack

**Decision:** Use **spacekit.js** (Three.js-based) for the interactive 3D solar-system map and trajectory visualization in the browser. Pair it with a lightweight JavaScript (or optional Python/poliastro) backend for speed/energy accumulation, event application, and trajectory generation.

**Rationale:**
- Runs entirely in the browser — no install required for collaborators or viewers.
- spacekit.js is purpose-built for solar-system and spacecraft trajectory visualization and already used in production projects.
- Keeps the prototype easily shareable and editable by any agent.
- Sufficient fidelity for design exploration (patched conics + impulsive Δv + Oberth modeling).

**Alternatives considered:**
- Kerbal Space Program: Excellent intuition tool but closed-source and not reusable for a multi-agent web prototype.
- Full Orekit/GMAT: Higher fidelity but heavier; better reserved for later validation.
- Pure custom Canvas: More work for less visual quality.

**Status:** Skeleton added in `prototype/spacekit/`.

## Orbital Mechanics Notation

The canonical contract is [trajectory-schema.json](../prototype/spacekit/trajectory-schema.json), using JSON Schema draft 2020-12. It follows the Keplerian / Cartesian conventions described in [ORBITAL_NOTATION.md](ORBITAL_NOTATION.md).

### 2026-10-24: Formal trajectory contract (issue #1)

- Use `initialElements` for the initial state, matching the existing example. The old `elements` spelling is no longer accepted.
- Use nonnegative scalar `deltaV_km_s` plus required `direction` (`prograde`, `retrograde`, `radial`, `normal`) for impulse events. Vector Δv and separate event `units` fields are not supported; state vectors remain supported for Cartesian initial states.
- Retain `oberthBurn` as a distinct event requiring `perihelion_AU`, matching the placeholder engine. Other events are `burn`, `tetherRelease`, `hitchhike`, and `gravityAssist`.
- Require compatible conic parameters: positive a and 0 ≤ e < 1 for ellipses, negative a and e > 1 for hyperbolas. Parabolic elements (e = 1) are outside this contract.
- Require explicit units, a date-time epoch with timezone, and a supported inertial frame. Reject unknown fields to catch obsolete spellings and typos.

The engine remains a placeholder: it reads scalar impulse magnitudes but does not yet interpret directions, initial states, or gravity assists physically. Formal validation does not imply a dynamically feasible trajectory. Implementing physics and visualization is separate work.

Run `npm ci` then `npm test` to validate the example and exercise valid and invalid trajectories with Ajv. The example demonstrates the event vocabulary; it is not a propagated mission solution.
