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

Full JSON Schema will live in `prototype/spacekit/trajectory-schema.json` (to be added).
