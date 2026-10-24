# Voyager reference baselines

`prototype/spacekit/scenarios/voyager-1.json` and `voyager-2.json` provide
historical speed references alongside the speculative concepts. Their index ids
are `voyager-1` and `voyager-2`. Both run through the same engine, speed chart and
travel-time panel as the concepts.

## Historical anchors and sources

| Baseline | Launch (UTC) | Flyby sequence (calendar dates) |
| --- | --- | --- |
| Voyager 1 | 1977-09-05 12:56:01 | Jupiter 1979-03-05; Saturn 1980-11-12 |
| Voyager 2 | 1977-08-20 14:29:44 | Jupiter 1979-07-09; Saturn 1981-08-25; Uranus 1986-01-24; Neptune 1989-08-25 |

The NASA/JPL mission fact sheets for
[Voyager 1](https://science.nasa.gov/mission/voyager/voyager-1/) and
[Voyager 2](https://science.nasa.gov/mission/voyager/voyager-2/) supply these launch
times and encounter sequences. Voyager 2's Saturn date follows the fact sheet's
Key Dates convention and issue #38: August 25 locally, August 26 in UTC. Event
ids and notes record calendar dates without asserting a UTC encounter timestamp.

NASA's [Voyager Fast Facts](https://science.nasa.gov/mission/voyager/fast-facts/)
reports approximate escape rates of 3.6 and 3.3 AU/year, respectively (about
17.1 and 15.6 km/s). Those rounded, finite-distance rates establish the speed
scale; they are not precise asymptotic velocities. The calibration targets here
are issue #38's heliocentric v∞ values: **16.9 km/s** and **15.2 km/s**, each with
a ±0.3 km/s acceptance tolerance. For a local heliocentric speed v at radius r,
the engine removes the remaining solar potential using v∞² = v² − 2μ☉/r.

## Model and calibration

The epoch records the real launch instant, but the initial state is an
illustrative post-departure heliocentric ellipse, shared by both baselines:
a = 5 AU, e = 0.8, perihelion = 1 AU, aphelion = 9 AU, zero inclination and
orientation angles, starting at perihelion. Launch injection is outside the
modeled Δv budget. This state is chosen to reach Jupiter; it is not a measured
Voyager launch state.

All events are unpowered `gravityAssist` encounters. Each moves to the outbound
crossing of the planet's built-in orbital radius and rotates planet-relative
v∞ while conserving its magnitude. No impulse or artificial speed increment is
added. The nominal center-to-center periapses below are model inputs at roughly
the historical distance scale, not fitted navigation data. B-plane angles are
model orientations, not reconstructed spacecraft encounter planes.

| Baseline | Body | Periapsis (km, from center) | B-plane angle (degrees) |
| --- | --- | ---: | ---: |
| Voyager 1 | Jupiter | 349,000 | 0 |
| Voyager 1 | Saturn | 184,000 | 73.224203 |
| Voyager 2 | Jupiter | 645,000 | 0 |
| Voyager 2 | Saturn | 161,000 | 90 |
| Voyager 2 | Uranus | 107,000 | 0 |
| Voyager 2 | Neptune | 29,564 | 86.535494 |

The final encounter's B-plane angle was found by bisection over 0–180° against
`applyTrajectory(doc).vInf_km_s`, holding all other inputs fixed. At these inputs,
the computed final speeds are **16.900000 km/s** and **15.200000 km/s**; total
modeled impulsive Δv is zero. Every encounter applies without warnings and clears
the planet surface. Tests verify these properties, schema validity, and agreement
between the full engine run and the viewer's leg-by-leg calculation.

The engine assumes circular prograde planets and a zero-radius sphere of
influence. It does not solve planetary phase, dated encounters, Titan/Triton
targeting, or full multi-body navigation. Dates in event ids/notes are historical
annotations: the schema applies events sequentially without scheduling them.
The viewer's two-body preview times and drawn trajectory therefore illustrate
the model rather than reproduce the historical mission timeline or geometry.

## Picker ordering and verification

`scenarios/index.json` is ordered by the actual final engine v∞, rather than
`targetAsymptotic_km_s` or rounded descriptions. Current order (km/s):
Concept C 196.483179, Concept A 112.647509, Concept B 107.562248,
Voyager 1 16.900000, Voyager 2 15.200000. The first entry supplies both the
picker selection and the viewer's default load when no `?scenario=` is supplied.
An explicit scenario path still takes precedence. `schema-example.json` stays
available for tests and explicit loading, but is absent from the reference index.

Run `npm ci && npm test` from the repository root. Scenario tests require every
JSON scenario to appear exactly once in the index, validate and run every entry,
check Voyager historical anchors and escape-speed tolerances, and compare the
index order with engine-computed speeds.
