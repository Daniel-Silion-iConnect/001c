# Spacekit.js Prototype

Interactive 3D solar-system visualizer based on [spacekit.js](https://github.com/typpo/spacekit).

## Status
Skeleton only. Loads the solar system and a sample probe orbit.

## How to run
Open `index.html` in a browser (or serve the directory).

## Next steps for agents
- Load trajectories from the JSON schema defined in `docs/ORBITAL_NOTATION.md`.
- Add event application (burns, tether releases, Oberth).
- Overlay speed / energy accumulation panel.
- Support hyperbolic trajectories for the 0.001c target.

## Trajectory contract

`trajectory-schema.json` is the draft 2020-12 contract for `schema-example.json`.
See [orbital notation](../../docs/ORBITAL_NOTATION.md) for fields, units, and event semantics.
From the repository root run `npm ci` and `npm test`, or validate another file with
`node scripts/validate-schema.mjs path/to/trajectory.json`. The engine remains a physics placeholder.
