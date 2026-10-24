# ORBITAL_NOTATION.md

The machine-readable contract is [trajectory-schema.json](../prototype/spacekit/trajectory-schema.json), JSON Schema draft 2020-12. The [example](../prototype/spacekit/schema-example.json) demonstrates impulses and flybys; [Concept B](../prototype/spacekit/scenarios/scenario-b.json) demonstrates a solar sail.

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
| `tetherRelease` | `direction` and exactly one of `deltaV_km_s`, `tipSpeed_km_s`, or `tetherLength_km` + `rotationPeriod_s` |
| `hitchhike` | `deltaV_km_s`, `direction` |
| `gravityAssist` | Nonempty `body` and at least one of `periapsis_km`, `periapsisAltitude_km` (not both), `turnAngle_deg` |
| `solarSail` | `beta`, dimensionless lightness number, 0 ≤ β < 1 |
| `laserCavityBoost` | positive `power_MW`, `duration_s`, `probeMass_kg`; `recyclingFactor` ≥ 1; `direction` |
| `ionDrive` | positive `isp_s`, `power_W`, `halfLife_days`, `wetMass_kg`, `dryMass_kg`; `conversionEfficiency`, `thrusterEfficiency` in (0, 1]; `direction` |
| `pelletStream` | positive `pelletMass_kg`, integer `pelletCount`, positive `relativeVelocity_km_s`, `probeMass_kg`; `momentumEfficiency` in [0, 1]; `direction` |

Impulse magnitudes are nonnegative scalars in km/s; zero is allowed for a no-op. `direction` is required and uses the pre-event local state: `prograde` follows velocity, `retrograde` opposes velocity, `radial` points away from the central body, and `normal` follows the angular momentum vector r × v. The frame and initial state determine these vectors; degenerate vectors require engine handling. This version provides no inward radial, negative normal, or explicit vector impulses. `hitchhike` uses the same local direction convention; modeling alignment with a target object's velocity is future engine work.

`oberthBurn` is the chosen distinct event type for an impulse at a specified perihelion distance from the central body's center.

### `pelletStream`

Ideal external pellets are ionised and magnetically reflected at a fixed
relative speed. Each pellet has mass `pelletMass_kg`; `pelletCount` is a positive
safe integer (at most 2⁵³ − 1). The total incident mass is their product.
`relativeVelocity_km_s` is the pellet approach speed in the probe's frame,
not its heliocentric speed. The launcher must increase successive launch
speeds as the probe accelerates (a chirped stream).

For constant `probeMass_kg`, integrated momentum gives
Δv = 2 · `momentumEfficiency` · `relativeVelocity_km_s` · total pellet mass /
probe mass. The factor of two assumes ideal reflection; the efficiency scales
that momentum transfer from zero to one. Pellets are expelled, not accreted;
the small-pellet approximation neglects discrete recoil corrections. There is
no rocket-equation mass ratio or carried mass budget between events.

The engine applies Δv at the current position along `direction`, using the
pre-event local vectors. It counts this external momentum in
`totalDeltaV_km_s`. `log[].pelletStream` reports total pellet mass and ideal
launch kinetic energy. The energy is the midpoint sum ½ Σ mₚ(w + vⱼ)² over
probe speeds from zero to Δv, as in `analysis/ideas_calc.py`; it excludes initial
heliocentric motion, launcher inefficiency, and ionisation energy. This is an
**equivalent impulse at the start**, not a finite-duration powered trajectory.
Pellet delivery, aiming, ionisation, heating, and steering are not simulated.

[Concept F](../prototype/spacekit/scenarios/scenario-f.json) uses 10,000 pellets
of 0.000375 kg (3.75 kg total), a **2 kg probe**, 100 km/s relative speed, and
0.8 efficiency: **300 km/s Δv**, about **131 GJ** ideal launch energy. The
matching `chirped_pellet_stream` Python function retains the original checked
speed budget: v∞ = √((v_escape(5 AU) + Δv − Δv_gravity)² − v_escape(5 AU)²),
where Δv_gravity = μ☉ · (30 days) / (5 AU)² ≈ 0.615 km/s is a conservative
gravity-loss allowance at the starting radius.

To encode that budget without a fictitious rocket burn, the scenario starts
on an ellipse at 5 AU perihelion with speed v_escape − Δv_gravity ≈ 18.223 km/s
(`a = 38.93347694817181 AU`, `e = 0.8715758161888292`). The allowance is already
debited from the initial state; the event adds the full 300 km/s prograde.
The resulting solar **v∞ is 317.665 km/s**, matching the checked **317.7 km/s**.
Python uses rounded AU and solar μ; the engine differs by less than 0.001 km/s.
This geometry represents the scalar speed budget, not the actual 30-day path
or delivery to 5 AU. The preview shows the resulting coast. Aiming and ionising
every pellet over AU scales remains the TRL 2 showstopper; one un-ionised pellet
destroys the probe. The scenario is explicitly exotic and speculative.

### `ionDrive`

An ideal constant-Isp ion engine powered by exponential radioactive decay.
`power_W` is initial **thermal** source power, `halfLife_days` is its decay
half-life, `conversionEfficiency` converts heat to electricity, and
`thrusterEfficiency` converts electricity to exhaust kinetic energy. The engine
requires `wetMass_kg > dryMass_kg > 0`; the schema checks each mass separately.
Masses are local to this event, including the source and hardware in dry mass;
the engine does not carry a mass budget between events.

With g₀ = 9.80665 m/s², exhaust speed vₑ = `isp_s` · g₀,
τ = `halfLife_days` · 86400 / ln(2), and initial jet power
Pⱼ₀ = `power_W` · `conversionEfficiency` · `thrusterEfficiency`, integrate
Pⱼ(t) = Pⱼ₀ exp(−t/τ) over all future time: Eⱼ = Pⱼ₀ τ. Expelled propellant is
min(wet − dry, 2Eⱼ/vₑ²), and Δv = vₑ ln(wet / final mass). Insufficient energy
leaves unused propellant aboard; excess energy cannot reduce mass below dry mass.
`direction` uses the pre-event local vectors. The resulting Δv counts in
`totalDeltaV_km_s`; `log[].ionDrive` reports decay time, jet power/energy, exhaust
speed, consumed propellant, final mass and initial acceleration.

This is an **equivalent impulse at the start**, using all future decay energy
as an upper bound, not a finite-thrust trajectory. At the reference Isp, using
all 4 kg of xenon takes infinite time in this ideal exponential model. It does
not propagate the months-long powered leg, solar gravity during thrust,
steering, thermal losses beyond the specified efficiencies, or Earth escape.
The visualization shows the post-impulse coast, not the actual powered mission.

[Concept E](../prototype/spacekit/scenarios/scenario-e.json) uses 0.4 kg Po-210
at 144 W/g (57.6 kW thermal initially), 138.376 day half-life, efficiencies
0.3 and 0.7, and 6.4/2.4 kg wet/dry masses. Its Isp of 32935.157345 s gives
322.984 km/s exhaust and 316.792 km/s Δv, matching `po210_ion_drive` in
`analysis/ideas_calc.py`. Starting on a circular 1 AU orbit with a radial
outward impulse preserves the tangential orbital velocity, so
v∞² = Δv² − μ☉/AU, giving **315.388 km/s**, within the analysis's 315–320 range.
The engine uses precise solar constants; Python's rounded constants change
v∞ by less than 0.001 km/s. Po-210 supply and the assumed 30% direct-charge
conversion remain the speculative architecture's showstoppers (TRL 2–3).

### `laserCavityBoost`

Ideal photon-recycling laser shot: input laser power `power_MW` is multiplied
by the dimensionless effective reflection count `recyclingFactor`. Reflective
thrust is F = 2 N P / c, acceleration is F / `probeMass_kg`, and the integrated
speed gain is Δv = F · `duration_s` / `probeMass_kg`. The required `direction`
uses the pre-event local vectors defined above. This speed gain counts in
`totalDeltaV_km_s` even though energy and momentum come from external infrastructure.

The engine enforces the analysis's Doppler cap:
`recyclingFactor` ≤ c / (2 · v_final), with c and v_final in the same units.
Here v_final is the shot's launcher-relative speed gain Δv, not the final
heliocentric speed. For 280 km/s, the cap is about 535; Concept D's 300 passes.
An excessive factor throws before the impulse is applied. This bound does not
simulate the time-dependent optical losses within an allowed shot.

The engine applies this integrated thrust at the current launch position; it
does not propagate a finite-duration powered leg. Constant power, recycling
and probe mass, an effectively fixed recoil anchor, and perfect beam capture
are assumed. Earth/Moon escape losses, Doppler losses, cavity stability, mirror
heating and structural feasibility are outside this approximation. The log's
`laserCavity` object reports force, acceleration (SI and g), circulating power,
input energy, duration, and boost distance relative to the launcher.

Concept D starts on a circular 1 AU solar orbit and points prograde: a 2 kg
probe, N = 300, 391.7288118 MW and 714.2857143 s give Δv = 280 km/s, about
40 g over 100,000 km, and v∞ ≈ 306.9 km/s. The reference function
`laser_cavity_boost` in `analysis/ideas_calc.py` uses rounded c, AU and μ☉;
the engine uses its existing precise constants (differences < 0.01 km/s).
This is an exotic, speculative TRL 2 architecture; the Moon-anchored moving
optical cavity is assumed, not demonstrated.

### `solarSail`

An ideal sail oriented normal to the Sun supplies outward radial acceleration
βμ☉/r². Only `centralBody: "Sun"` is supported. Deployment preserves position and
velocity and changes the propagation parameter to μ_eff = μ☉(1 − β). The current
attractive-conic solver requires β < 1; zero-gravity and repulsive trajectories
are rejected. β = 0 jettisons the sail and restores true solar gravity. A later
`solarSail` replaces the active β rather than adding to it.

Optional `location` uses the same apsis / true-anomaly convention as
`tetherRelease`, defaulting to `current`. The engine first moves along the
previous conic, then changes β at that position. An unreachable location warns
and uses the current position. The sail stays active across later events until
another `solarSail` changes it or the trajectory ends. To end a finite sail leg,
use `{ "type": "solarSail", "beta": 0, "location": 60 }`, where 60° is the true
anomaly on the active sail conic. No impulse, `direction`, or `deltaV_km_s` is
required or accepted, and radiation pressure adds no impulsive Δv to the budget.

The predicted asymptotic energy uses true solar gravity plus remaining sail work:
E∞ = (v²/2 − μ☉/r) + βμ☉/r. Thus v∞² = v² − 2μ☉(1 − β)/r, as in the hybrid
formula in [reference scenarios §3.3](analyses/reference-scenarios.md#33-back-of-envelope-calculation-concept-b).
`vInf_km_s`, `bound`, and `specificEnergy_km2_s2` describe this projected escape
while the sail remains deployed. `gravityOnlySpecificEnergy_km2_s2` and each log
entry's `gravityOnlyVInf_km_s` describe the local state against true μ☉ without
future sail work. Jettison retains only work already delivered; no velocity is
lost instantaneously. For deployment at r₁ and jettison at r₂, delivered work is
βμ☉(1/r₁ − 1/r₂). A bound sail conic still reports null v∞.

`finalElements` and `ephemerisPoints` use `effectiveMu_km3_s2`, returned alongside
`sailBeta`. When resuming those elements with `applyEvents`, pass
`{ sailBeta: previousResult.sailBeta }`; `options.mu` continues to mean the true
central-body parameter. Flyby bodies retain their true-gravity orbital speeds.
The 97.66 km/s pure-sail reference assumes a parabolic arrival at 10 R☉; removing
the kick from Concept B's bound transfer ellipse yields a slightly lower speed.

### `gravityAssist`

Patched-conic flyby with a zero-radius sphere of influence at the probe's position.

- `body`: `Venus`, `Earth`, `Mars`, `Jupiter`, `Saturn`, `Uranus`, or `Neptune` use built-in constants. Any other name needs `mu_km3_s2` (km³/s²), plus `bodyRadius_km` and `bodyOrbit_AU` as required. These fields also override the built-in values.
- Periapsis: `periapsis_km` is measured from the body's center; `periapsisAltitude_km` is measured above its equatorial radius.
- `turnAngle_deg` is the deflection of v∞ in the body's frame. If it is given without a periapsis, the engine solves r_p = μ/v∞² · (1/sin(δ/2) − 1) (unpowered only). If it is given with a periapsis, it is only a consistency check: the engine uses the computed angle and logs a warning on mismatch.
- `location`: `encounter` (default) moves along the conic to the outbound crossing of the body's orbital radius. `current` flies by at the probe's current position. If the orbit never reaches the body, the event is skipped with a warning.
- The body is assumed to be on a circular, prograde orbit in the reference (x–y) plane, so v∞_in = v_probe − v_body comes from the state. Turn angle δ = 2·asin(1/e), with e = 1 + r_p v∞²/μ_body.
- `side`: `trailing` (default) turns v∞ toward the body's velocity for maximum energy gain; `leading` turns it the other way. `bPlaneAngle_deg` instead rotates the turn plane about v∞_in: 0° is trailing, 180° is leading, ±90° is out of plane.
- `deltaV_km_s` with `direction` `prograde` (default) or `retrograde` makes it a powered flyby, with the burn at periapsis. The turn angle is then δ = asin(1/e_in) + asin(1/e_out). A powered flyby needs an explicit periapsis. If the burn would capture the probe, the event is skipped.
- The engine logs `flyby`: v∞ in/out, eccentricities, turn angle, heliocentric speeds, and Δv. Only the periapsis burn counts in `totalDeltaV_km_s`; the gravity-assist Δv is free.

### `tetherRelease`

Momentum-exchange tether. Assumptions:
- The tether is rigid, massless, and much shorter than the orbital radius, so the release point is the probe's position.
- The release is impulsive.
- The facility + payload centre of mass is on the probe's current conic.

Fields:
- `tipSpeed_km_s` is the payload speed relative to the facility at release. Alternatively, give `tetherLength_km` + `rotationPeriod_s` (tip speed = 2πL/T), or give the imparted `deltaV_km_s` directly.
- `massRatio` = M_facility / m_payload (default ∞). Payload Δv = tipSpeed · M/(M + m), and the facility recoils by −Δv / massRatio.
- `location` is `current` (default), `perihelion` / `periapsis`, `aphelion` / `apoapsis`, or a true anomaly in degrees. `direction` is the tip velocity at release.
- The engine logs `tether`: tip speed, payload Δv, facility recoil, and payload acceleration in g when the length is known. The payload Δv counts in `totalDeltaV_km_s`.

The old `elements`, vector `deltaV`, and event `units` fields are rejected. The engine (`prototype/spacekit/engine.js`) models `burn`, `oberthBurn`, `gravityAssist`, `tetherRelease`, `solarSail`, `laserCavityBoost`, `ionDrive`, and `pelletStream`. It passes `hitchhike` through with a warning.

## Validation

From the repository root:

```sh
npm ci
npm test
node scripts/validate-schema.mjs path/to/trajectory.json
```

The script defaults to the checked-in example, accepts multiple files, validates date-time formats using ajv-formats, and exits nonzero for invalid JSON, unreadable input, or schema violations. Schema validation checks structure and parameter constraints; dynamic feasibility requires engine validation.
