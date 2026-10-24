import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { test } from 'node:test';
import { validateTrajectory } from '../scripts/validate-schema.mjs';

const example = JSON.parse(await readFile(new URL('../prototype/spacekit/schema-example.json', import.meta.url)));
const check = (name, expected, change) => test(name, () => {
  const value = structuredClone(example);
  change(value);
  assert.equal(validateTrajectory(value), expected, JSON.stringify(validateTrajectory.errors));
});

check('example covers all event types', true, value => assert.equal(value.events.length, 5));
check('empty events and optional metadata', true, value => {
  value.events = [];
  delete value.name; delete value.description; delete value.targetAsymptotic_km_s;
});
check('hyperbolic orbit with signed anomaly and km', true, value => {
  Object.assign(value.initialElements, { a: -100000, e: 1.5, nu: -30 });
  value.initialElements.units.a = 'km';
});
check('mean anomaly instead of true anomaly', true, value => {
  delete value.initialElements.nu; value.initialElements.M = 10;
});
for (const r of ['AU', 'km']) check(`Cartesian state in ${r}`, true, value => {
  value.initialElements = { type: 'cartesian', r: [1, 0, 0], v: [0, 30, 0], units: { r, v: 'km/s' } };
});
for (const direction of ['prograde', 'retrograde', 'radial', 'normal']) check(`direction ${direction}`, true, value => {
  value.events[0].direction = direction; value.events[0].deltaV_km_s = 0;
});
for (const field of ['epoch', 'centralBody', 'frame', 'initialElements', 'events']) {
  check(`missing ${field}`, false, value => delete value[field]);
}
for (const [name, change] of Object.entries({
  'obsolete elements': value => { value.elements = value.initialElements; delete value.initialElements; },
  'unknown field': value => { value.typo = true; },
  'invalid epoch': value => { value.epoch = '2026-02-30T00:00:00Z'; },
  'epoch without timezone': value => { value.epoch = '2026-10-24T00:00:00'; },
  'numeric epoch': value => { value.epoch = 2460000; },
  'unsupported frame': value => { value.frame = 'unknown'; },
  'missing anomaly': value => { delete value.initialElements.nu; },
  'two anomalies': value => { value.initialElements.M = 0; },
  'negative eccentricity': value => { value.initialElements.e = -0.1; },
  'parabola': value => { value.initialElements.e = 1; },
  'hyperbola with positive a': value => { value.initialElements.e = 2; },
  'ellipse with negative a': value => { value.initialElements.a = -1; },
  'zero a': value => { value.initialElements.a = 0; },
  'inclination out of range': value => { value.initialElements.i = 181; },
  'unsupported angle units': value => { value.initialElements.units.angles = 'rad'; },
  'missing units': value => { delete value.initialElements.units; },
  'unknown event': value => { value.events[0].type = 'warp'; },
  'missing direction': value => { delete value.events[0].direction; },
  'unknown direction': value => { value.events[0].direction = 'outward'; },
  'negative impulse': value => { value.events[0].deltaV_km_s = -1; },
  'vector impulse': value => { value.events[0].deltaV = [1, 0, 0]; },
  'missing magnitude': value => { delete value.events[0].deltaV_km_s; },
  'missing Oberth context': value => { delete value.events[1].perihelion_AU; },
  'zero perihelion': value => { value.events[1].perihelion_AU = 0; },
  'context on ordinary burn': value => { value.events[0].perihelion_AU = 1; },
  'missing assist body': value => { delete value.events[4].body; },
  'zero assist periapsis': value => { value.events[4].periapsis_km = 0; },
  'invalid assist angle': value => { value.events[4].turnAngle_deg = 180; },
  'impulse on assist': value => { value.events[4].deltaV_km_s = 1; },
  'negative target': value => { value.targetAsymptotic_km_s = -1; },
  'numeric string': value => { value.events[0].deltaV_km_s = '3'; }
})) check(name, false, change);
for (const [name, change] of Object.entries({
  'short position': value => { value.r.pop(); },
  'long velocity': value => { value.v.push(0); },
  'nonnumeric vector': value => { value.r[0] = '1'; },
  'wrong velocity units': value => { value.units.v = 'AU/day'; },
  'mixed element fields': value => { value.a = 1; }
})) check(name, false, value => {
  value.initialElements = { type: 'cartesian', r: [1, 0, 0], v: [0, 30, 0], units: { r: 'AU', v: 'km/s' } };
  change(value.initialElements);
});
test('CLI exits nonzero for invalid input and missing files', () => {
  for (const path of ['package.json', 'missing-trajectory.json']) {
    const result = spawnSync(process.execPath, ['scripts/validate-schema.mjs', path], { cwd: new URL('../', import.meta.url), encoding: 'utf8' });
    assert.equal(result.status, 1, result.stderr);
  }
});
