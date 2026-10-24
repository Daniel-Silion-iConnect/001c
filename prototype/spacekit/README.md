# Trajectory viewer

Static, schema-driven trajectory visualization. The page loads JSON, runs the
patched-conic engine, and draws the initial orbit plus the orbit after every event.
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

The default scenario is `schema-example.json`. Load another file with the form or
`?scenario=other-trajectory.json` (paths resolve relative to the viewer). Absolute
HTTP URLs also work if their server permits CORS.

Select a leg or numbered event to inspect its v∞ in km/s and percentage of c
and move the white probe to that leg's preview start. The initial view selects
the initial leg. Bound orbits display “Bound orbit” because
they have no escape asymptote; a parabolic escape displays zero. In 3D, drag to
rotate and scroll to zoom. The canvas fallback uses an oblique projection in AU;
it retains the same leg selector, event markers, probe, and HUD.

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

Each leg is a sampled complete conic. Playback uses elliptic or hyperbolic
Kepler propagation to place the probe at the requested time, rather than moving
uniformly through the sampled points. Ellipses cover one period from apoapsis;
open paths run from the inbound radius cap through periapsis to the outbound
cap. Parabolic states produced by burns use Barker's equation.
The probe resets between independent conics: cumulative preview time is the
sum of their flight times, not a mission epoch or scheduled event-to-event arc.
Ellipses are closed orbits; hyperbolic and parabolic legs are open polylines capped
at 30 AU. Numbered markers use the engine's actual post-event position. Coincident
markers have offset labels so each event remains selectable.

The engine currently skips `tetherRelease`, `gravityAssist`, and `hitchhike`;
the UI labels these events as skipped and exposes their warnings under Engine
notes. An Oberth event can include an implicit perihelion-retargeting burn; its
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

`scenarios/` holds the baseline variants of Concepts A, B and C from
[reference-scenarios.md](../../docs/analyses/reference-scenarios.md) as schema-valid
trajectories, listed in `scenarios/index.json` (`id`, `name`, `file`, `summary`). The
viewer's **Reference scenario** picker (`scenario-picker.js`) loads them; the schema
example stays the default. Each file starts after the Earth departure and Jupiter
assist, which are not modelled. `targetAsymptotic_km_s` records the doc's far-field
linear v∞. Tether stations sit at 10–30 AU, so their Δv adds almost linearly. Concept B's
solar sail has no schema event yet: the file encodes only the perihelion kick, and
`scenarios.test.js` applies the doc's hybrid equation to the engine's perihelion state.
