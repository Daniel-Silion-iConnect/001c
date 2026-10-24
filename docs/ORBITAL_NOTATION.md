# ORBITAL_NOTATION.md

Internal notation and schema for trajectories and events in the 001c project.

## Goals
- Use widely understood orbital mechanics conventions.
- Make data machine-readable so any agent (or the engine) can apply events without ambiguity.
- Support both elliptical and hyperbolic (escape) trajectories.

## Classical Keplerian Elements

| Symbol | Name | Unit (preferred) | Notes |
|--------|------|------------------|-------|
| a | Semi-major axis | AU or km | Negative for hyperbolas |
| e | Eccentricity | dimensionless | >1 for hyperbolas |
| i | Inclination | deg | |
| Ω / raan | Right ascension of ascending node | deg | |
| ω / argp | Argument of periapsis | deg | |
| ν / nu | True anomaly | deg | Or mean anomaly M |
| epoch | Epoch | ISO 8601 or JD | |

Frame: ICRS / ecliptic-compatible for solar-system work.

## Cartesian Alternative

Position and velocity vectors in the same frame:
- `r`: [x, y, z] in AU or km
- `v`: [vx, vy, vz] in km/s

## Event Schema

Events are applied sequentially to an initial state. The engine is responsible for computing the resulting asymptotic speed and updated elements.

Example event types:
- `burn`: impulsive Δv (vector or magnitude + direction)
- `oberthBurn`: burn at specified perihelion distance (energy multiplication handled by engine)
- `tetherRelease`: additive Δv from momentum exchange
- `hitchhike`: small additional Δv aligned with target object velocity

### Fields understood by `prototype/spacekit/engine.js`

Elements: `a` (negative for hyperbolas) **or** `rp` (periapsis distance, same unit as `a`; required for parabolas, e = 1). The engine also returns `rp` in `finalElements`; `a` is `null` for a parabola.

`burn`:
- Δv as `deltaV_km_s` (magnitude) + `direction`: `prograde` (default), `retrograde`, `normal`, `antinormal`, `radialOut`, `radialIn`;
  or as `deltaV: [V, N, C]` + `units` (`km/s` or `m/s`) in the local VNC frame (V along velocity, N along orbit normal, C = V × N).
- `location`: `current` (default), `perihelion` / `periapsis`, `aphelion` / `apoapsis`, or a true anomaly in degrees. Unreachable locations (aphelion of a hyperbola, perihelion when already outbound) fall back to the current position with a warning.

`oberthBurn`: `deltaV_km_s` applied prograde at perihelion. If `perihelion_AU` is given and differs from the current perihelion, the engine first performs a tangential burn at aphelion to set it (bound orbits only). That Δv is logged in `perihelionAdjust` and counted in `totalDeltaV_km_s`.

`tetherRelease`, `gravityAssist`, `hitchhike`: accepted but not modelled yet. They are passed through with a warning.

Full JSON Schema will live in `prototype/spacekit/trajectory-schema.json` (to be added).
