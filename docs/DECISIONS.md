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

We adopt a clear, standard Keplerian / Cartesian hybrid inspired by:
- CCSDS Orbit Data Messages (OPM / OMM / OEM)
- poliastro classical elements
- Orekit orbit representations

### Canonical Internal Schema (JSON)

```json
{
  "epoch": "2026-10-24T00:00:00Z",
  "centralBody": "Sun",
  "frame": "ICRS",
  "elements": {
    "type": "keplerian",
    "a": 1.5,
    "e": 0.2,
    "i": 1.5,
    "raan": 45.0,
    "argp": 90.0,
    "nu": 0.0,
    "units": {
      "a": "AU",
      "angles": "deg"
    }
  },
  "events": [
    {
      "type": "burn",
      "deltaV": [0.5, 0, 0],
      "units": "km/s",
      "location": "perihelion"
    }
  ]
}
```

**Supported element types:**
- `keplerian` (classical: a, e, i, Ω/raan, ω/argp, ν or M)
- `cartesian` (r, v vectors)
- Hyperbolic: negative semi-major axis or e > 1

**Event types (to be expanded):**
- `burn` (impulsive Δv, with optional Oberth context)
- `tetherRelease`
- `hitchhike`
- `gravityAssist`

The engine (to be implemented) will accept a sequence of these events and produce updated states or ephemeris points that the spacekit visualizer consumes.

See `prototype/spacekit/schema-example.json` and `docs/ORBITAL_NOTATION.md` for full details.
