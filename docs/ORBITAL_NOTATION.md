# ORBITAL_NOTATION.md

The machine-readable contract is [trajectory-schema.json](../prototype/spacekit/trajectory-schema.json), JSON Schema draft 2020-12. The [example](../prototype/spacekit/schema-example.json) demonstrates every event type.

## Trajectory envelope

Required fields are `epoch`, `centralBody`, `frame`, `initialElements`, and `events`. Optional metadata is `name` (nonempty), `description`, and nonnegative `targetAsymptotic_km_s`. Unknown properties are rejected throughout.

`epoch` is an RFC 3339 date-time string with timezone, such as `2026-10-24T00:00:00Z`; Julian dates are not accepted. `centralBody` is a nonempty body name (for example `Sun`). `frame` is `ICRS` or `ECLIPJ2000` (mean ecliptic and equinox of J2000). Positions and velocities are relative to the central body in that inertial frame. Conversion between frames belongs to the engine.

## Initial state

Use `initialElements`, with exactly one of these representations:

### Keplerian

| Field | Meaning | Units / constraints |
|-------|---------|---------------------|
| type | Representation | `keplerian` |
| a | Semi-major axis | `units.a`: `AU` or `km` |
| e | Eccentricity | Dimensionless, nonnegative |
| i | Inclination | Degrees, 0 through 180 |
| raan | Right ascension of ascending node (Ω) | Degrees |
| argp | Argument of periapsis (ω) | Degrees |
| nu or M | True anomaly (ν) or mean anomaly | Degrees; exactly one required |
| units | Explicit units | `{ "a": "AU", "angles": "deg" }` or a in `km` |

Ellipses require `a > 0` and `0 <= e < 1`; hyperbolas require `a < 0` and `e > 1`. Zero semi-major axes and parabolic elements (`e = 1`) are rejected. Angles other than inclination are unrestricted to allow signed hyperbolic anomalies and unwrapped angles. Checking the physically accessible true-anomaly range is an engine responsibility. Circular/equatorial states may use zero for undefined orientation angles by convention.

### Cartesian

Use `type: "cartesian"`, `r: [x, y, z]`, `v: [vx, vy, vz]`, and `units: { "r": "AU", "v": "km/s" }` (or `r` in `km`). Both vectors must contain exactly three numbers in the trajectory frame.

## Events

`events` is an ordered array, which may be empty. Events are applied sequentially from the initial state; this contract has no timed event scheduling. Each event has a discriminating `type` and optional nonempty `id` and string `notes`.

| type | Required payload |
|------|------------------|
| `burn` | `deltaV_km_s`, `direction` |
| `oberthBurn` | `deltaV_km_s`, `direction`, positive `perihelion_AU` |
| `tetherRelease` | `deltaV_km_s`, `direction` |
| `hitchhike` | `deltaV_km_s`, `direction` |
| `gravityAssist` | Nonempty `body`, positive `periapsis_km`, `turnAngle_deg` strictly between 0 and 180 |

Impulse magnitudes are nonnegative scalars in km/s; zero is allowed for a no-op. `direction` is required and uses the pre-event local state: `prograde` follows velocity, `retrograde` opposes velocity, `radial` points away from the central body, and `normal` follows the angular momentum vector r × v. The frame and initial state determine these vectors; degenerate vectors require engine handling. This version provides no inward radial, negative normal, or explicit vector impulses. `hitchhike` uses the same local direction convention; modeling alignment with a target object's velocity is future engine work.

`oberthBurn` is the chosen distinct event type for an impulse at a specified perihelion distance from the central body's center. Gravity-assist periapsis is measured from the assist body's center in km; its turn angle is the magnitude of the incoming-to-outgoing asymptotic velocity deflection in that body's frame. These fields describe context, not a complete encounter solution (orientation, encounter timing, and ephemerides are future engine work). Gravity assists have no prescribed Δv.

The old `elements`, vector `deltaV`, and event `units` fields are rejected. The placeholder engine consumes `deltaV_km_s` and recognizes `oberthBurn`, but its rough arithmetic is not validated orbital physics and currently ignores gravity assists and directions.

## Validation

From the repository root:

```sh
npm ci
npm test
node scripts/validate-schema.mjs path/to/trajectory.json
```

The script defaults to the checked-in example, accepts multiple files, validates date-time formats using ajv-formats, and exits nonzero for invalid JSON, unreadable input, or schema violations. Schema validation checks structure and parameter constraints; dynamic feasibility requires engine validation.
