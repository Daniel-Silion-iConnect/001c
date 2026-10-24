import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { AU_KM, C_KM_S, MU, applyTrajectory, circularSpeed } from './engine.js';
import { validateScenario, trueAnomalyFromMean, engineElements, buildTrajectory, speedText, buildSpeedSeries, targetProgress, SPEED_TARGET_KM_S, buildPlayback, playbackAt,
  anomalyOfPosition, radiusCapAnomaly, legArcSpan, sampleArc, buildContinuousArcs, buildContinuousPlayback } from './viewer-data.js';
import { legColor } from './renderers.js';
import { cruiseYears, buildTravelTimeRows, formatTravelYears, CRUISE_TARGET_KM_S,
  LIGHT_YEAR_KM, JULIAN_YEAR_S } from './viewer-data.js';

const example = JSON.parse(readFileSync(new URL('./schema-example.json', import.meta.url)));
const scenario = () => structuredClone(example);
const near = (a, b, tolerance = 1e-9) => assert.ok(Math.abs(a - b) < tolerance, `${a} ≠ ${b}`);

test('cruise times convert AU and light-years and compare with exactly 0.001c', () => {
  near(CRUISE_TARGET_KM_S, 299.792458);
  assert.equal(JULIAN_YEAR_S, 31557600);
  near(LIGHT_YEAR_KM, 9460730472580.8, 0.01);
  near(cruiseYears(31557600 * 10, 10), 1);
  const rows = buildTravelTimeRows(CRUISE_TARGET_KM_S / 2);
  assert.equal(rows.length, 7);
  assert.deepEqual(rows.map(row => [row.distance, row.unit]), [
    [39.5, 'AU'], [120, 'AU'], [2000, 'AU'], [100000, 'AU'],
    [4.24, 'ly'], [5.96, 'ly'], [7.86, 'ly']
  ]);
  near(rows[0].targetYears, 0.6245940427, 1e-9);
  for (const row of rows) near(row.years, 2 * row.targetYears);
  for (const [index, years] of [[4, 4240], [5, 5960], [6, 7860]]) near(rows[index].targetYears, years);
});

test('cruise times use final scenario speed and preserve bound and zero escape cases', () => {
  const doc = JSON.parse(readFileSync(new URL('./scenarios/scenario-c.json', import.meta.url)));
  const model = buildTrajectory(doc);
  const rows = buildTravelTimeRows(model.result.vInf_km_s);
  near(rows[4].years, 4.24 * C_KM_S / model.result.vInf_km_s);
  assert.ok(rows[4].years < cruiseYears(4.24 * LIGHT_YEAR_KM, model.legs[0].vInf_km_s));
  for (const speed of [null, 0]) {
    const unavailable = buildTravelTimeRows(speed);
    assert.ok(unavailable.every(row => row.years === null && row.targetYears > 0));
  }
  near(cruiseYears(0, 10), 0);
  for (const speed of [-1, NaN, Infinity, undefined, '10']) assert.throws(() => cruiseYears(AU_KM, speed), /Escape speed/);
  for (const distance of [-1, NaN, Infinity]) assert.throws(() => cruiseYears(distance, 10), /Distance/);
});

test('travel times format years, thousands of years, and missing asymptotes', () => {
  assert.equal(formatTravelYears(null), '—');
  assert.equal(formatTravelYears(0), '0.0 yr');
  assert.equal(formatTravelYears(0.62458), '0.6 yr');
  assert.equal(formatTravelYears(999), '999.0 yr');
  assert.equal(formatTravelYears(1000), '1.00k yr');
  assert.equal(formatTravelYears(4240), '4.24k yr');
  assert.equal(formatTravelYears(100000), '100.00k yr');
  for (const value of [-1, NaN, Infinity]) assert.throws(() => formatTravelYears(value), /Time/);
});

test('viewer retains sail state across events and plays the effective-gravity conic', () => {
  const doc = JSON.parse(readFileSync(new URL('./scenarios/scenario-b.json', import.meta.url)));
  doc.events.push({ type: 'burn', deltaV_km_s: 1, direction: 'prograde' });
  const model = buildTrajectory(doc);
  const engine = applyTrajectory(doc);
  near(model.result.vInf_km_s, engine.vInf_km_s);
  near(model.result.totalDeltaV_km_s, 7);
  assert.equal(model.result.sailBeta, 0.25);
  const playback = buildPlayback(model);
  for (const index of [2, 3]) {
    const leg = playback.legs[index];
    near(leg.mu, 0.75 * MU.Sun);
    nearPosition(playbackAt(playback, leg.start_s).position, model.legs[index].ephemerisPoints[0].r_AU);
    const midpoint = playbackAt(playback, leg.start_s + leg.duration_s / 2);
    near(Math.hypot(...midpoint.position), model.legs[index].finalElements.rp);
  }
  doc.events.push({ type: 'solarSail', beta: 0, location: 60 });
  const jettisoned = buildTrajectory(doc);
  near(jettisoned.result.vInf_km_s, applyTrajectory(doc).vInf_km_s);
  near(buildPlayback(jettisoned).legs.at(-1).mu, MU.Sun);
  assert.equal(jettisoned.result.sailBeta, 0);
});

test('viewer validation rejects invalid solar sail parameters', () => {
  for (const event of [
    { type: 'solarSail' }, { type: 'solarSail', beta: -0.1 },
    { type: 'solarSail', beta: 1 }, { type: 'solarSail', beta: Infinity },
    { type: 'solarSail', beta: '0.25' }, { type: 'solarSail', beta: 0.25, location: 'outbound' }
  ]) {
    const doc = scenario(); doc.events = [event];
    assert.throws(() => validateScenario(doc), /solarSail|sail location/);
  }
  const doc = scenario(); doc.centralBody = 'Earth'; doc.events = [{ type: 'solarSail', beta: 0.25 }];
  assert.throws(() => validateScenario(doc), /Sun/);
});

test('speed series preserves actual per-leg speeds, event order, labels, and skipped events', () => {
  const model = buildTrajectory(example);
  const original = structuredClone(model);
  const series = buildSpeedSeries(model);
  assert.equal(series.length, example.events.length + 1);
  assert.deepEqual(series[0], { index: 0, label: 'Initial orbit', status: 'initial', vInf_km_s: null });
  for (const [i, event] of example.events.entries()) {
    assert.deepEqual(series[i + 1], {
      index: i + 1, label: event.id ?? event.type,
      status: model.result.log[i].status, vInf_km_s: model.legs[i + 1].vInf_km_s
    });
  }
  const skipped = series.find(step => step.status === 'skipped');
  near(skipped.vInf_km_s, series[skipped.index - 1].vInf_km_s);
  assert.deepEqual(model, original);
  const doc = scenario(); doc.events = [];
  assert.deepEqual(buildSpeedSeries(buildTrajectory(doc)), [series[0]]);
});

test('speed history and target progress can decrease and return to a bound orbit', () => {
  const doc = scenario();
  doc.events = [
    { type: 'burn', deltaV_km_s: 20, direction: 'prograde' },
    { type: 'burn', deltaV_km_s: 1, direction: 'retrograde' },
    { type: 'burn', deltaV_km_s: 19, direction: 'retrograde' }
  ];
  const series = buildSpeedSeries(buildTrajectory(doc));
  assert.ok(series[1].vInf_km_s > series[2].vInf_km_s);
  assert.ok(series[2].vInf_km_s > 0);
  assert.ok(targetProgress(series[2].vInf_km_s).gap_km_s > targetProgress(series[1].vInf_km_s).gap_km_s);
  assert.equal(series[3].vInf_km_s, null);
  assert.equal(targetProgress(series[3].vInf_km_s).progressPercent, 0);
});

test('300 km/s target readout distinguishes bound, parabolic, below, at, and above target', () => {
  assert.equal(SPEED_TARGET_KM_S, 300);
  assert.deepEqual(targetProgress(null), { bound: true, gap_km_s: 300, percentReached: 0, progressPercent: 0 });
  assert.deepEqual(targetProgress(0), { bound: false, gap_km_s: 300, percentReached: 0, progressPercent: 0 });
  assert.deepEqual(targetProgress(75), { bound: false, gap_km_s: 225, percentReached: 25, progressPercent: 25 });
  assert.deepEqual(targetProgress(300), { bound: false, gap_km_s: 0, percentReached: 100, progressPercent: 100 });
  assert.deepEqual(targetProgress(450), { bound: false, gap_km_s: 0, percentReached: 150, progressPercent: 100 });
  assert.deepEqual(targetProgress(75, 150), { bound: false, gap_km_s: 75, percentReached: 50, progressPercent: 50 });
  for (const invalid of [NaN, Infinity, -Infinity, -1, undefined]) assert.throws(() => targetProgress(invalid), /Escape speed/);
  for (const invalid of [NaN, Infinity, -Infinity, -1, 0]) assert.throws(() => targetProgress(1, invalid), /target/);
});

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
  assert.deepEqual(result.log.map(e => e.status), ['applied', 'applied', 'applied', 'skipped', 'applied']);
  assert.deepEqual(result.log.map(e => e.index), [0, 1, 2, 3, 4]);
  assert.match(result.log[3].warnings[0], /not modelled/);
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

const conicPreview = (a, e, centralBody = 'Sun', orientation = {}) => {
  const doc = scenario();
  doc.centralBody = centralBody; doc.events = [];
  doc.initialElements = { type: 'keplerian', a, e, i: 0, raan: 0, argp: 0, nu: 0,
    units: { a: 'AU', angles: 'deg' }, ...orientation };
  return buildPlayback(buildTrajectory(doc));
};
const nearPosition = (actual, expected, tolerance = 1e-8) => actual.forEach((x, i) => near(x, expected[i], tolerance));

test('elliptic playback uses Kepler time, one period, and the correct central body', () => {
  for (const centralBody of ['Sun', 'Earth']) {
    const a = 2, e = 0.6;
    const playback = conicPreview(a, e, centralBody);
    const n = Math.sqrt(MU[centralBody] / (a * AU_KM) ** 3);
    near(playback.duration_s * n, 2 * Math.PI);
    nearPosition(playbackAt(playback, 0).position, [-a * (1 + e), 0, 0]);
    nearPosition(playbackAt(playback, playback.duration_s).position, [-a * (1 + e), 0, 0]);
    nearPosition(playbackAt(playback, playback.duration_s / 2).position, [a * (1 - e), 0, 0]);
    // E = -π/2: x = a(cos E - e), y = a sqrt(1-e²) sin E.
    nearPosition(playbackAt(playback, (Math.PI / 2 + e) / n).position, [-a * e, -a * Math.sqrt(1 - e * e), 0]);
  }
  const circle = conicPreview(1, 0);
  nearPosition(playbackAt(circle, circle.duration_s / 4).position, [0, -1, 0]);
  const inclined = conicPreview(1, 0, 'Sun', { i: 90 });
  nearPosition(playbackAt(inclined, inclined.duration_s / 4).position, [0, 0, -1]);
});

test('hyperbolic playback solves signed Kepler time and stays inside 30 AU', () => {
  const a = -2, e = 1.5;
  const playback = conicPreview(a, e);
  const n = Math.sqrt(MU.Sun / (Math.abs(a) * AU_KM) ** 3);
  const hCap = Math.acosh((30 / Math.abs(a) + 1) / e);
  const capTime = (e * Math.sinh(hCap) - hCap) / n;
  near(playback.duration_s / (2 * capTime), 1);
  near(Math.hypot(...playbackAt(playback, 0).position), 30);
  near(Math.hypot(...playbackAt(playback, playback.duration_s).position), 30);
  for (const h of [-1, 0, 1]) {
    const time = capTime + (e * Math.sinh(h) - h) / n;
    nearPosition(playbackAt(playback, time).position,
      [Math.abs(a) * (e - Math.cosh(h)), Math.abs(a) * Math.sqrt(e * e - 1) * Math.sinh(h), 0]);
  }
  for (let i = 0; i <= 100; i++) {
    const { position } = playbackAt(playback, i * playback.duration_s / 100);
    assert.ok(position.every(Number.isFinite));
    assert.ok(Math.hypot(...position) <= 30 + 1e-8);
  }
});

test('playback handles leg boundaries, clamping, skipped events, and no events without mutation', () => {
  const model = buildTrajectory(example);
  const original = structuredClone(model);
  const playback = buildPlayback(model);
  assert.equal(playback.legs.length, model.legs.length);
  assert.deepEqual(playbackAt(playback, -100), playbackAt(playback, 0));
  assert.deepEqual(playbackAt(playback, playback.duration_s + 100), playbackAt(playback, playback.duration_s));
  for (const [i, leg] of playback.legs.entries()) {
    assert.ok(leg.duration_s > 0);
    assert.equal(playbackAt(playback, leg.start_s).index, i);
    nearPosition(playbackAt(playback, leg.start_s).position, model.legs[i].ephemerisPoints[0].r_AU);
    const halfway = playbackAt(playback, leg.start_s + leg.duration_s / 2);
    near(halfway.legTime_s / leg.duration_s, 0.5);
  }
  assert.equal(playbackAt(playback, playback.duration_s).index, model.legs.length - 1);
  assert.deepEqual(model, original);
  assert.equal(conicPreview(1, 0).legs.length, 1);
  for (const value of [NaN, Infinity, -Infinity]) assert.throws(() => playbackAt(playback, value), /finite/);
  assert.throws(() => buildPlayback({ legs: [] }), /at least one/);
  assert.throws(() => buildPlayback(buildTrajectory(example, { ephemerisSamples: 0 })), /at least two/);
});

test('a burn to parabolic escape remains playable using Barker time', () => {
  const doc = scenario();
  doc.events = [{ type: 'burn', deltaV_km_s: (Math.SQRT2 - 1) * circularSpeed(MU.Sun, AU_KM), direction: 'prograde' }];
  const playback = buildPlayback(buildTrajectory(doc));
  const leg = playback.legs[1];
  assert.equal(leg.k.a, Infinity);
  const d = 1;
  const t = Math.sqrt(leg.k.p ** 3 / MU.Sun) / 2 * (d + d ** 3 / 3);
  const at = playbackAt(playback, leg.start_s + leg.duration_s / 2 + t);
  nearPosition(at.position, [0, leg.k.p / AU_KM, 0]);
  near(Math.hypot(...playbackAt(playback, leg.start_s).position), 30);
  near(Math.hypot(...playbackAt(playback, playback.duration_s).position), 30);
});

const conceptC = JSON.parse(readFileSync(new URL('./scenarios/scenario-c.json', import.meta.url)));
const conceptA = JSON.parse(readFileSync(new URL('./scenarios/scenario-a.json', import.meta.url)));
const dist = (a, b) => Math.hypot(...a.map((x, i) => x - b[i]));

for (const [name, doc] of [['A', conceptA], ['C', conceptC]]) {
  test(`Concept ${name} continuous arcs chain event to event and end at the 30 AU cap`, () => {
    const model = buildTrajectory(doc);
    const original = structuredClone(model);
    const arcs = buildContinuousArcs(model);
    // Scenario A rounds station anomalies to six decimals: its last station is
    // 0.0000056 AU beyond the cap. Preserve that actual event, without reversing.
    const capTolerance = name === 'A' ? 1e-5 : 1e-6;
    assert.equal(arcs.length, model.legs.length);
    for (const [i, arc] of arcs.entries()) {
      const leg = model.legs[i];
      nearPosition(arc.points[0].r_AU, leg.finalState.r_km.map(x => x / AU_KM), 1e-8);
      assert.ok(arc.endNu >= arc.startNu);
      if (i < model.markers.length) assert.ok(dist(arc.points.at(-1).r_AU, model.markers[i].position) < 1e-6, `leg ${i} misses event ${i + 1}`);
      for (const p of arc.points) assert.ok(Math.hypot(...p.r_AU) <= 30 + capTolerance);
    }
    near(Math.hypot(...arcs.at(-1).points.at(-1).r_AU), 30, capTolerance);
    // Post-tether legs are short hops, unlike the full conics that fan out from the Sun.
    for (const arc of arcs.slice(2)) assert.ok(Math.hypot(...arc.points[0].r_AU) >= 9.99);
    assert.ok(model.legs.slice(2).every(leg => Math.hypot(...leg.ephemerisPoints[0].r_AU) > 29));
    assert.deepEqual(model, original);
  });
}

test('continuous playback follows the arcs without jumps and stays monotonic in radius after perihelion', () => {
  const model = buildTrajectory(conceptC);
  const arcs = buildContinuousArcs(model);
  const playback = buildContinuousPlayback(model, arcs);
  assert.equal(playback.legs.length, arcs.length);
  nearPosition(playbackAt(playback, 0).position, arcs[0].points[0].r_AU);
  nearPosition(playbackAt(playback, playback.duration_s).position, arcs.at(-1).points.at(-1).r_AU, 1e-6);
  for (const [i, leg] of playback.legs.entries()) {
    assert.ok(leg.duration_s >= 0);
    if (i > 0) near(leg.start_s, playback.legs[i - 1].end_s, 1e-3);
    const before = playbackAt(playback, Math.max(0, leg.start_s - 1e-3)).position;
    const after = playbackAt(playback, leg.start_s + 1e-3).position;
    assert.ok(dist(before, after) < 1e-6, `jump at leg ${i}`);
  }
  let previous = 0;
  const perihelion_s = playback.legs[1].start_s;
  for (let j = 0; j <= 400; j++) {
    const t = perihelion_s + (playback.duration_s - perihelion_s) * j / 400;
    const r = Math.hypot(...playbackAt(playback, t).position);
    assert.ok(r >= previous - 1e-9);
    previous = r;
  }
  near(previous, 30, 1e-6);
});

test('arc spans wrap ellipses forward, never reverse open conics, and fly one period at the end', () => {
  const k = { p: AU_KM, a: AU_KM, e: 0, i: 0, raan: 0, argp: 0 };
  const at = (deg) => [Math.cos(deg * Math.PI / 180) * AU_KM, Math.sin(deg * Math.PI / 180) * AU_KM, 0];
  near(anomalyOfPosition(k, MU.Sun, at(90)), Math.PI / 2);
  near(anomalyOfPosition({ ...k, i: Math.PI / 2 }, MU.Sun, [0, 0, AU_KM]), Math.PI / 2);
  near(legArcSpan(k, MU.Sun, Math.PI / 2, at(0)).endNu, 2 * Math.PI);
  near(legArcSpan(k, MU.Sun, 0, at(0)).endNu, 0);
  near(legArcSpan(k, MU.Sun, 0.3, null).endNu, 0.3 + 2 * Math.PI);
  const hyper = { p: 2 * AU_KM * (1.5 ** 2 - 1), a: -2 * AU_KM, e: 1.5, i: 0, raan: 0, argp: 0 };
  const cap = radiusCapAnomaly(hyper, 30);
  near(elementsRadius(hyper, cap), 30, 1e-9);
  assert.equal(legArcSpan(hyper, MU.Sun, 1, [AU_KM, 0, 0]).endNu, 1);
  near(legArcSpan(hyper, MU.Sun, 0, null).endNu, cap);
  assert.equal(legArcSpan(hyper, MU.Sun, cap + 0.01, null).endNu, cap + 0.01);
  const pts = sampleArc(k, MU.Sun, 0, Math.PI, 3);
  nearPosition(pts[1].r_AU, [0, 1, 0]);
  assert.throws(() => sampleArc(k, MU.Sun, 0, 1, 1), /two samples/);
});

function elementsRadius(k, nu) { return k.p / (1 + k.e * Math.cos(nu)) / AU_KM; }

test('continuous playback of a bound final orbit lasts one period and handles zero-length legs', () => {
  const doc = scenario();
  doc.events = [
    { type: 'burn', deltaV_km_s: 0.5, direction: 'prograde' },
    { type: 'burn', deltaV_km_s: 0.5, direction: 'prograde' }
  ];
  const model = buildTrajectory(doc);
  const playback = buildContinuousPlayback(model);
  assert.equal(playback.legs[0].duration_s, 0);
  assert.equal(playback.legs[1].duration_s, 0);
  const k = playback.legs[2].k;
  near(playback.legs[2].duration_s / (2 * Math.PI * Math.sqrt(k.a ** 3 / MU.Sun)), 1);
  nearPosition(playbackAt(playback, playback.duration_s).position, playbackAt(playback, 0).position, 1e-8);
  assert.throws(() => buildContinuousArcs({ legs: [] }), /at least one/);
});

test('continuous sail arcs and playback use effective gravity through impulses and jettison', () => {
  const doc = JSON.parse(readFileSync(new URL('./scenarios/scenario-b.json', import.meta.url)));
  doc.events.push({ type: 'burn', deltaV_km_s: 1, direction: 'prograde' });
  doc.events.push({ type: 'solarSail', beta: 0, location: 60 });
  const model = buildTrajectory(doc);
  const original = structuredClone(model);
  const arcs = buildContinuousArcs(model);
  const playback = buildContinuousPlayback(model, arcs);
  for (const [i, arc] of arcs.entries()) {
    near(arc.mu, i === 2 || i === 3 ? 0.75 * MU.Sun : MU.Sun);
    near(arc.k.e, model.legs[i].finalElements.e);
    nearPosition(arc.points[0].r_AU, model.legs[i].finalState.r_km.map(x => x / AU_KM));
    if (i + 1 < arcs.length) nearPosition(arc.points.at(-1).r_AU, arcs[i + 1].points[0].r_AU);
    nearPosition(playbackAt(playback, playback.legs[i].start_s).position, arc.points[0].r_AU);
  }
  const final = playback.legs.at(-1);
  // Independent hyperbolic solution at H = 1, measured from the final arc's start.
  const H = 1, k = final.k;
  const t = (k.e * Math.sinh(H) - H) / Math.sqrt(final.mu / Math.abs(k.a) ** 3);
  const at = playbackAt(playback, final.start_s + t - final.periapsisStart_s);
  near(Math.hypot(...at.position), Math.abs(k.a) / AU_KM * (k.e * Math.cosh(H) - 1));
  near(Math.hypot(...playbackAt(playback, playback.duration_s).position), 30);
  assert.deepEqual(model, original);
});

test('continuous playback handles a parabolic escape and a no-event bound orbit', () => {
  const doc = scenario();
  doc.events = [{ type: 'burn', deltaV_km_s: (Math.SQRT2 - 1) * circularSpeed(MU.Sun, AU_KM), direction: 'prograde' }];
  const playback = buildContinuousPlayback(buildTrajectory(doc));
  const leg = playback.legs[1];
  assert.equal(leg.k.a, Infinity);
  const t = Math.sqrt(leg.k.p ** 3 / MU.Sun) / 2 * (1 + 1 / 3);
  nearPosition(playbackAt(playback, t).position, [0, leg.k.p / AU_KM, 0]);
  near(Math.hypot(...playbackAt(playback, playback.duration_s).position), 30);
  doc.events = [];
  const bound = buildContinuousPlayback(buildTrajectory(doc));
  near(bound.duration_s / (2 * Math.PI * Math.sqrt(AU_KM ** 3 / MU.Sun)), 1);
  nearPosition(playbackAt(bound, bound.duration_s / 4).position, [0, 1, 0]);
});
