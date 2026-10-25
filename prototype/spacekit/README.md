# Trajectory viewer

Static, schema-driven trajectory visualization. The page loads JSON, runs the
patched-conic engine, and draws a continuous event-to-event path.
Three.js provides interactive 3D; a local 2D canvas renderer starts immediately and
remains usable if the CDN fails, times out, or WebGL is unavailable.

## Run

From the repository root:

```sh
npx serve prototype/spacekit
```

Visit the printed HTTP URL. JSON fetching requires an HTTP server; opening
`index.html` through `file://` is not supported. No build step or runtime npm
installation is required. The 3D renderer imports pinned Three.js modules from
jsDelivr; the canvas renderer and engine have no external dependencies.

The default remains **Concept F**, the fastest kilogram-class scenario (its
modeled probe is 2 kg). `default: true` in `scenarios/index.json` makes that choice
explicit: the faster gram-scale Concept I comparisons have a different mass
budget and do not replace the project's kilogram-class starting point.
The picker stays in descending final v∞ order, including Voyager 1 and 2.
Every option starts with a trip time so mobile users can see it before a long
scenario name. Times are distance / indexed cruise speed to Proxima (4.24 ly),
except Concept I capture, which shows its separate ~95 yr Alpha Cen A benchmark.
The index's `cruiseSpeed_km_s` values are checked against the engine in tests;
`arrival` holds the Concept I benchmark, destination and qualifications.
The selected option's destination, timing assumptions and feasibility are also
visible below the picker. The schema example remains available by explicit path
for testing. Load another file with the form or
`?scenario=other-trajectory.json` (paths resolve relative to the viewer). Absolute
HTTP URLs also work if their server permits CORS.

The **Mission story** panel shows the reference scenario's short summary and an
explanation of the current leg's event type from `narratives.json`. Directly below
it, the **Full scenario story** card contains the scenario narrative and project
context, with the same layout for every scenario. Leg 0 describes the initial orbit. Event buttons, chart
steps, the leg selector, and playback all update the explanation. The STP Oberth
event also shows its solar-thermal propulsion context; skipped events are marked
as intended maneuvers. Reference narratives use IDs from `scenarios/index.json`.
Custom scenarios fall back to their description. Missing text or an unavailable
narrative file shows a short fallback without blocking the trajectory viewer.
The short story stays visible and wraps at mobile widths.

The scenario picker, selected-leg v∞ / percentage of c, gap to 300 km/s,
playback controls, mission story, and Proxima / heliopause cruise highlights
stay outside collapsible controls. **Advanced** starts closed and contains the
JSON path / Load form, frame and epoch, current-leg selector, full-conics toggle,
event list, and engine notes. Load errors remain visible outside
Advanced. At widths ≤900px, the plot follows the title, picker, and headline / target
block at 45vh tall. Playback, travel highlights, story, analysis cards, and
Advanced follow it in one scrolling page. Desktop uses a scrolling sidebar beside
the plot.

Select a leg or numbered event to inspect its v∞ in km/s, fraction and percentage of c
and move the white probe to that leg's preview start. The initial view selects
the initial leg. Bound orbits display “Bound orbit” because
they have no escape asymptote; a parabolic escape displays zero. In 3D, drag to
rotate and scroll to zoom. The canvas fallback uses an oblique projection in AU;
it retains the same leg selector, event markers, probe, and HUD.

The collapsible speed chart shows v∞ after every event, with the initial orbit as
step 0. Numbered steps match the event list; skipped steps and their incoming
segments are grey. Hollow points denote bound orbits and are not connected as
numeric zero speeds. Select a chart step to inspect its leg. The target readout
tracks the selected leg's remaining gap to 300 km/s (approximately 0.1% c),
percentage reached, and progress bar, even with the chart closed. Bound orbits contribute no escape-speed
progress; above-target speeds show a multiple of the target while the bar caps at 100%.

The **Travel time** highlights and **All travel times** table compare distance / final scenario v∞ with exactly
0.001c (299.792458 km/s) for Pluto, the heliopause, the Oort cloud edges, Proxima, Alpha Cen A/B (4.37 ly),
Barnard's Star and Wolf 359. It stays tied to the loaded scenario's final result
as you inspect other legs. Times use years (`0.6 yr`, `48 yr`), comma-grouped years
rounded to three significant figures from 1,000 (`6,470 yr`, `12,000 yr`), days
below 0.1 yr (so fast solar-system transits do not display “0 yr”), and
`million yr` from 1,000,000 (`1.2 million yr`). Bound or zero-speed escape states
show “—”. This cruise estimate ignores time spent
leaving the Sun's gravity, acceleration, braking and stellar motion. See
[milestone sources and assumptions](../../docs/analyses/travel-time-milestones.md).
The full scenario story, speed chart, and full travel table start expanded at widths ≥900px and closed
below 900px. Their summary controls support mouse, touch, and keyboard toggling;
resizing preserves the user's current choice.

### Concept I: Laser sail (Starshot-class)

Two exotic, beyond-target comparisons are explicitly **not a 1 kg probe**:

- **0.2c Proxima flyby:** 59,958.492 km/s and 21.2 yr cruise; no destination brake.
- **0.046c Alpha Cen A capture study:** 13,790.453 km/s and the ~95 yr A/B arrival
  scale from Heller & Hippke (2017). A-only full-stop geometry and orbit settling
  need a separate solution. The travel panel keeps this qualified literature
  benchmark separate from its distance / speed rows. The ~92.2 yr Proxima coast
  is not a captured arrival; the study's route via A/B takes ~141 yr to Proxima.

These are already-accelerated, 1 AU perihelion hyperbolas, with
`a = −μ☉/v∞²`, `e = 1 − 1 AU/a`, and no events. The engine shows an illustrative
Newtonian departure coast to 30 AU. It does not model a relativistic laser shot,
an interstellar intercept or stellar braking. No rocket or capture impulse is
fabricated. The roughly 100 GW array, gram chip, meter-scale sail and lack of a
0.2c brake are explained in the stories; the much larger, lighter-per-area
capture sail is a separate architecture. Numbers, caveats and primary sources
are in [nano-swarm.md](../../docs/analyses/nano-swarm.md).

Press **Play** to preview all legs in sequence, **Pause** to stop, or scrub the
**Preview time** slider (including with the keyboard) to seek while paused.
Playback stops at the end; **Replay** starts again from the initial leg. A full
preview takes one minute at a constant simulated-time scale. The HUD reports
total preview time and elapsed time within the current leg, in days. Switching
between 2D and 3D, including after WebGL context loss, preserves the probe time.

## Scope and validation

The browser checks required fields, finite numbers, units, conic signs, event
payloads, and supported central bodies (Sun, Earth, Jupiter). It adapts Cartesian
states, mean anomaly, and the schema's outward `radial` direction for the engine.
Coordinates stay in the scenario's declared inertial frame; no reference planets
or frame conversion are needed for this single-body view.

Each leg starts at its own event (or the initial state) and ends at the next
event's position. The final open leg runs to the 30 AU radius cap; a bound final
leg covers one orbit. **Show full conics** adds faint complete conics for context
without changing the path or playback. Both renderers share the same sampled arcs.

Playback uses elliptic or hyperbolic Kepler propagation, or Barker's equation for
parabolic states, rather than moving uniformly through samples. It uses the same
arc boundaries as the drawing and the effective gravity when a solar sail is
active. Co-located and skipped events take zero preview time. Preview time sums
two-body flight times; it is not a mission epoch or scheduled encounter solution.
Numbered markers use actual post-event positions, with offset labels for
coincident markers. The Sun marker and Sun/Earth/Jupiter labels use screen-space
HTML, with 14px text and an 18px central-body marker at every zoom. On narrow
screens the plot and controls stack in a single scrolling page. Earth and Jupiter
labels have dots at fixed 315° points on their rings, with leader lines keeping
the connection visible when text shifts to avoid overlap. Both renderers project
these anchors on every redraw; an offscreen anchor hides its label and leader.
The central-body label has a matching gold leader anchored to the origin disc,
independently of the nearby reference-orbit markers.

The engine models burns, tethers, gravity assists, and solar sails; `hitchhike`
is skipped with a warning under Engine notes. An Oberth event can include an implicit perihelion-retargeting burn; its
intermediate transfer conic is not shown, and this is noted in the HUD. The example
illustrates the event vocabulary rather than a validated mission solution.

The authoritative contract is [trajectory-schema.json](./trajectory-schema.json).
For full JSON Schema validation and the engine/viewer helper tests:

```sh
npm ci
npm test
node scripts/validate-schema.mjs path/to/trajectory.json
```

Run those commands from the repository root. Tests require Node ≥ 18 and the
repository's development dependencies. The browser itself needs none of them.

## Hosting

[pages.yml](../../.github/workflows/pages.yml) tests and publishes this directory,
including every local JS/CSS/JSON dependency, using `upload-pages-artifact` and
`deploy-pages` on pushes to `main` (or manual dispatch). In repository Settings →
Pages, choose **GitHub Actions** as the source.

Live at **https://daniel-silion-iconnect.github.io/001c/** (repo is public; Pages on a private repo would need GitHub Pro/Team, see [GitHub's plan requirements](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages)).
[Firebase Hosting](https://firebase.google.com/docs/hosting) is an alternative:
serve `prototype/spacekit` as the public directory, with no build command.

## Engine API

```js
import { applyEvents, applyTrajectory } from './engine.js';
const out = applyTrajectory(trajectoryJson, { ephemerisSamples: 257 });
// out: { finalElements, bound, vInf_km_s, fractionOfC, totalDeltaV_km_s,
//        specificEnergy_km2_s2, finalState, ephemerisPoints, log, ... }
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
Burns change the state vector and recompute the conic. Speeds follow vis-viva;
the Oberth result follows the change in orbital energy without an artificial
multiplier. `viewer-data.js` builds per-event legs from `applyEvents` and adapts
schema inputs; `viewer.js` handles loading, HUD, and renderer selection.

## Reference scenarios

Concept H divides G's probe allocation into 1,000 independent 1 g chips, each
with ~0.646 m² sail (~0.323 g). Equal total areal density preserves β and
300 km/s solar v∞. The view is one representative conditional flyby, with no
modeled capture, gathering or factory. See the
[nano-swarm analysis](../../docs/analyses/nano-swarm.md) for laser launch,
attrition, braking, assembly and optical-link budgets and the architecture verdict.

Concept G adds an exotic, conditional carbon `solarSail` at 3 solar radii:
β = 0.710365490 on a delivered 5.204 AU aphelion ellipse predicts 300 km/s
solar v∞ with zero impulsive Δv. Its ~646 m² sail and 1 kg shielded probe assume
unproven combined optics, heat rejection, deployment and mass properties.
See the [Orion/sundiver analysis](../../docs/analyses/orion-and-sundiver-hybrid.md).

Concept F adds an exotic, speculative chirped `pelletStream`: 3.75 kg of
reflected pellets gives a 2 kg probe 300 km/s Δv and solar v∞ 317.665 km/s.
Its initial speed at 5 AU already includes the Python reference's conservative
30-day gravity-loss allowance. The preview applies an equivalent impulse and
shows the resulting coast. The picker displays feasibility and the showstopper:
aiming and ionising every pellet over AU scales. See the
[event contract](../../docs/ORBITAL_NOTATION.md#pelletstream) for assumptions.

`scenarios/` holds Voyager 1 and 2 plus the baseline variants of Concepts A, B and C from
[reference-scenarios.md](../../docs/analyses/reference-scenarios.md) as schema-valid
trajectories, listed in `scenarios/index.json` (`id`, `name`, `file`, `summary`). The
viewer's **Reference scenario** picker (`scenario-picker.js`) loads them, fastest
final v∞ first; tests check the index order against the engine. The Voyager files
preserve historical launch dates and dated flyby sequences with unpowered assists
calibrated to 16.9 and 15.2 km/s. They use nominal flyby geometries rather than an
ephemeris reconstruction; see [sources and calibration](../../docs/analyses/voyager-baselines.md).
Each Concept A/B/C file starts after the Earth departure and Jupiter
assist, which are not modelled. `targetAsymptotic_km_s` records the doc's far-field
linear v∞. Tether stations sit at 10–30 AU, so their Δv adds almost linearly. Concept B's
`solarSail` event deploys a β = 0.25 radial sail after the perihelion kick. The
engine propagates with μ☉(1 − β) and predicts the doc's hybrid v∞ of 107.56 km/s.
Set β to zero in a later sail event to jettison it; only work already delivered is
retained. The current conic solver supports 0 ≤ β < 1. See the
[sail contract](../../docs/ORBITAL_NOTATION.md#solarsail) for energy and continuation semantics.
