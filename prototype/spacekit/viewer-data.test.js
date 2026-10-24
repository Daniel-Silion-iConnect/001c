import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { AU_KM, C_KM_S, MU, applyTrajectory, circularSpeed } from './engine.js';
import { validateScenario, trueAnomalyFromMean, engineElements, buildTrajectory, speedText } from './viewer-data.js';
import { legColor } from './renderers.js';

const example = JSON.parse(readFileSync(new URL('./schema-example.json', import.meta.url)));
const scenario = () => structuredClone(example);
const near = (a, b, tolerance = 1e-9) => assert.ok(Math.abs(a - b) < tolerance, `${a} ≠ ${b}`);

test('light validation accepts the example and rejects malformed required fields', () => {
  assert.equal(validateScenario(example), example);
  for (const change of [
    d => { d.epoch = '2026-10-24'; },
    d => { d.centralBody = 'toString'; },
    d => { d.frame = 'unknown'; },
    d => { d.initialElements = null; },
    d => { d.initialElements.units.a = 'm'; },
    d => { d.initialElements.e = 1.5; },
    d => { d.initialElements.M = 30; },
    d => { delete d.initialElements.nu; },
    d => { d.events = {}; },
    d => { d.events[0].deltaV_km_s = -1; },
    d => { d.events[0].direction = 'typo'; },
    d => { d.events[1].perihelion_AU = 0; },
    d => { d.events[4].turnAngle_deg = 180; },
    d => { d.events[0] = null; }
  ]) {
    const doc = scenario(); change(doc);
    assert.throws(() => validateScenario(doc), Error);
  }
  assert.throws(() => validateScenario(null), /object/);
});

test('mean anomaly adapter solves elliptic and signed hyperbolic Kepler equations', () => {
  near(trueAnomalyFromMean(450, 0), 90);
  near(trueAnomalyFromMean(0, 0.999), 0);
  near(Math.abs(trueAnomalyFromMean(180, 0.6)), 180);
  // Elliptic E = π/2 yields M = π/2 - e and ν = 2 atan(sqrt((1+e)/(1-e))).
  near(trueAnomalyFromMean((Math.PI / 2 - 0.5) * 180 / Math.PI, 0.5), 120);
  for (const h of [-2, 0, 2]) {
    const e = 1.7;
    const mean = (e * Math.sinh(h) - h) * 180 / Math.PI;
    const expected = 2 * Math.atan(Math.sqrt((e + 1) / (e - 1)) * Math.tanh(h / 2)) * 180 / Math.PI;
    near(trueAnomalyFromMean(mean, e), expected);
  }
  const doc = scenario(); doc.events = []; delete doc.initialElements.nu; doc.initialElements.M = 90;
  const { legs } = buildTrajectory(doc);
  near(legs[0].finalState.r_km[0] / AU_KM, 0);
  near(legs[0].finalState.r_km[1] / AU_KM, 1);
});

test('Cartesian adapter preserves positions and velocities in AU and km', () => {
  for (const unit of ['AU', 'km']) {
    const doc = scenario(); doc.events = [];
    doc.initialElements = {
      type: 'cartesian', r: [0, unit === 'AU' ? 1 : AU_KM, 0],
      v: [-circularSpeed(MU.Sun, AU_KM), 0, 0], units: { r: unit, v: 'km/s' }
    };
    const original = structuredClone(doc);
    near(engineElements(doc.initialElements, 'Sun').nu, 90);
    const { result } = buildTrajectory(doc);
    near(result.finalState.r_km[0] / AU_KM, 0);
    near(result.finalState.r_km[1] / AU_KM, 1);
    near(result.finalState.v_km_s[0], doc.initialElements.v[0]);
    assert.deepEqual(doc, original);
    doc.initialElements.r = [0, 0, 0];
    assert.throws(() => buildTrajectory(doc), /nonzero/);
  }
});

test('all legs, event positions, totals, and warnings agree with the engine', () => {
  const untouched = structuredClone(example);
  const { legs, markers, result } = buildTrajectory(example);
  const engine = applyTrajectory(example);
  assert.equal(legs.length, example.events.length + 1);
  assert.equal(markers.length, example.events.length);
  near(result.totalDeltaV_km_s, engine.totalDeltaV_km_s);
  near(result.finalElements.a, engine.finalElements.a);
  assert.deepEqual(result.log.map(e => e.status), ['applied', 'applied', 'skipped', 'skipped', 'skipped']);
  assert.deepEqual(result.log.map(e => e.index), [0, 1, 2, 3, 4]);
  assert.match(result.log[2].warnings[0], /not modelled/);
  near(Math.hypot(...markers[1].position), 0.1); // The actual Oberth location, not the previous state.
  for (const [index, leg] of legs.entries()) {
    assert.equal(leg.ephemerisPoints.length, 257);
    assert.ok(leg.ephemerisPoints.every(p => p.r_AU.every(Number.isFinite)));
    if (index) assert.deepEqual(markers[index - 1].position, leg.finalState.r_km.map(x => x / AU_KM));
  }
  assert.deepEqual(example, untouched);
});

test('escape leg remains open, radial schema directions work, and parabolic states continue', () => {
  const doc = scenario();
  doc.events = [{ type: 'burn', deltaV_km_s: 20, direction: 'prograde' }, { type: 'burn', deltaV_km_s: 1, direction: 'radial' }];
  const { legs } = buildTrajectory(doc);
  assert.equal(legs[0].bound, true);
  assert.equal(legs[1].bound, false);
  assert.ok(legs[1].finalElements.e > 1);
  assert.ok(legs[2].finalState.v_km_s[0] > 0.9);
  const points = legs[1].ephemerisPoints;
  assert.notDeepEqual(points[0].r_AU, points.at(-1).r_AU);
  for (const point of points) assert.ok(Math.hypot(...point.r_AU) <= 30 * (1 + 1e-9));
  doc.events = [
    { type: 'burn', deltaV_km_s: (Math.SQRT2 - 1) * circularSpeed(MU.Sun, AU_KM), direction: 'prograde' },
    { type: 'burn', deltaV_km_s: 1, direction: 'prograde' }
  ];
  const parabolic = buildTrajectory(doc);
  assert.equal(parabolic.legs[1].vInf_km_s, 0);
  assert.ok(parabolic.legs[2].vInf_km_s > 0);
});

test('empty events show the initial orbit and null v∞ means bound, not zero', () => {
  const doc = scenario(); doc.events = [];
  const result = buildTrajectory(doc);
  assert.equal(result.legs.length, 1);
  assert.deepEqual(result.markers, []);
  assert.equal(result.result.totalDeltaV_km_s, 0);
  assert.match(speedText(null).speed, /Bound/);
  assert.match(speedText(null).percent, /no escape/);
  assert.deepEqual(speedText(0), { speed: '0.000 km/s', percent: '0.000000% of c' });
  assert.deepEqual(speedText(C_KM_S / 1000), { speed: '299.792 km/s', percent: '0.100000% of c' });
  assert.equal(legColor(0), legColor(6));
  assert.notEqual(legColor(0), legColor(1));
});
