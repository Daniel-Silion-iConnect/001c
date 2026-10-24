# Spacekit.js Prototype

Interactive 3D solar-system visualizer based on [spacekit.js](https://github.com/typpo/spacekit).

## Status
Skeleton only. Loads the solar system and a sample probe orbit.

## How to run
Open `index.html` in a browser (or serve the directory).

## Engine (`engine.js`)
Patched-conic / impulsive-Δv engine (single central body, two-body conics).

```js
import { applyEvents, applyTrajectory } from './engine.js';
const out = applyTrajectory(schemaExampleJson, { ephemerisSamples: 64 });
// out: { finalElements, bound, vInf_km_s, asymptoticSpeed_km_s, fractionOfC,
//        totalDeltaV_km_s, specificEnergy_km2_s2, finalState, ephemerisPoints, log }
```

- Speeds from vis-viva `v² = μ(2/r − 1/a)`, elliptic (a > 0), parabolic (`rp`, a = ∞) and hyperbolic (a < 0).
- Burns are applied to the state vector, then elements are recomputed.
- Oberth: `oberthBurn` burns prograde at perihelion, so `v∞ = sqrt((v_p + Δv)² − v_esc²)` emerges directly. No multiplier.
- Bound orbits report `bound: true`, `vInf_km_s: null`, `fractionOfC: null`.
- `gravityAssist`: patched-conic flyby. v∞_in is taken relative to a circular, coplanar planet orbit, turned by δ = 2·asin(1/(1 + r_p v∞²/μ)), with an optional powered periapsis burn.
- `tetherRelease`: rigid rotating tether. Δv = tip speed · M/(M + m), applied at `location` along `direction`.
- See `docs/ORBITAL_NOTATION.md` for fields and assumptions. `hitchhike` and unknown types are passed through with a warning in `log`.

Tests: `npm test` from the repo root (Node ≥ 18, no dependencies).

## Next steps for agents
- Load trajectories from the JSON schema defined in `docs/ORBITAL_NOTATION.md`.
- Add event application (burns, tether releases, Oberth).
- Overlay speed / energy accumulation panel.
- Support hyperbolic trajectories for the 0.001c target.

## Trajectory contract

`trajectory-schema.json` is the draft 2020-12 contract for `schema-example.json`.
See [orbital notation](../../docs/ORBITAL_NOTATION.md) for fields, units, and event semantics.
From the repository root run `npm ci` and `npm test`, or validate another file with
`node scripts/validate-schema.mjs path/to/trajectory.json`.
