// Unit tests for the patched-conic engine. Run with `npm test`.
// Reference numbers are hand-checked in the comments (μ☉ = 1.32712440018e11
// km³/s², 1 AU = 1.495978707e8 km, μ⊕ = 398600.4418 km³/s²,
// μ♃ = 1.26686534e8 km³/s², R♃ = 71492 km, a♃ = 5.202887 AU).

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import {
  AU_KM,
  C_KM_S,
  MU,
  applyEvents,
  applyTrajectory,
  circularSpeed,
  elementsToState,
  escapeSpeed,
  flybyTurnAngle,
  oberthVInf,
  poweredFlyby,
  stateToElements,
  tetherDeltaV,
  vInfinity,
  visViva
} from './engine.js';

const near = (actual, expected, tol, msg) =>
  assert.ok(
    Math.abs(actual - expected) <= tol,
    `${msg ?? ''} expected ${expected} ± ${tol}, got ${actual}`
  );

const circular1AU = { type: 'keplerian', a: 1, e: 0, units: { a: 'AU', angles: 'deg' } };

// ---------- pelletStream ----------

const conceptF = JSON.parse(readFileSync(new URL('./scenarios/scenario-f.json', import.meta.url)));
const pelletEvent = conceptF.events[0];
const pelletReference = (ev) => JSON.parse(execFileSync('python3', ['-c', `
import contextlib, io, json, runpy, sys
with contextlib.redirect_stdout(io.StringIO()):
    calc = runpy.run_path(sys.argv[1])
ev = json.loads(sys.argv[2])
print(json.dumps(calc['chirped_pellet_stream'](ev['pelletMass_kg'], ev['pelletCount'],
    ev['relativeVelocity_km_s'], ev['momentumEfficiency'], ev['probeMass_kg'])))
`, new URL('../../analysis/ideas_calc.py', import.meta.url).pathname, JSON.stringify(ev)], { encoding: 'utf8' }));

test('Concept F matches Python pellet momentum, launch energy and checked 317.7 km/s escape', () => {
  const ref = pelletReference(pelletEvent);
  const out = applyTrajectory(conceptF);
  const stream = out.log[0].pelletStream;
  near(out.totalDeltaV_km_s, ref.deltaV_km_s, 1e-10, 'Python momentum Δv');
  near(out.vInf_km_s, ref.vInf_km_s, 0.001, 'Python v∞ (rounded solar constants)');
  near(stream.totalPelletMass_kg, ref.totalPelletMass_kg, 1e-12);
  near(stream.launchEnergy_J, ref.launchEnergy_J, 0.001, 'Python midpoint launch KE');
  near(out.totalDeltaV_km_s, 300, 1e-10, 'Δv differs from v∞');
  near(out.vInf_km_s, 317.7, 0.05);
  near(stream.totalPelletMass_kg, 3.75, 1e-12);
  near(stream.launchEnergy_J / 1e9, 131.25, 1e-6);
  // The scenario encodes the reference's conservative 30-day gravity debit
  // in its initial speed. The event supplies the full 300 km/s only once.
  const before = out.log[0].before;
  near(before.r_AU, 5, 1e-12);
  near(before.speed_km_s, ref.initialSpeed_km_s, 0.001);
  const vEsc = escapeSpeed(MU.Sun, 5 * AU_KM);
  const gravityLoss = MU.Sun * 30 * 86400 / (5 * AU_KM) ** 2;
  near(gravityLoss, ref.gravityLoss_km_s, 0.00003, 'rounded AU changes the gravity allowance by 0.02 m/s');
  near(before.speed_km_s, vEsc - gravityLoss, 1e-12);
  near(out.log[0].after.speed_km_s, before.speed_km_s + 300, 1e-10);
  near(out.vInf_km_s ** 2, (vEsc - gravityLoss + 300) ** 2 - vEsc ** 2, 1e-9);
  assert.equal(out.log[0].status, 'applied');
  assert.deepEqual(out.finalState.r_km, applyTrajectory({ ...conceptF, events: [] }).finalState.r_km);
  assert.match(stream.model, /reflected pellets; equivalent impulse at start/);
});

test('pellet momentum scales with mass, count, relative speed, efficiency and inverse probe mass', () => {
  for (const [key, factor] of [['pelletMass_kg', 2], ['pelletCount', 2],
    ['relativeVelocity_km_s', 2], ['momentumEfficiency', 0.5], ['probeMass_kg', 2]]) {
    const ev = { ...pelletEvent, [key]: pelletEvent[key] * factor };
    const ref = pelletReference(ev);
    const out = applyTrajectory({ ...conceptF, events: [ev] });
    near(out.totalDeltaV_km_s, ref.deltaV_km_s, 1e-10, key);
    near(out.vInf_km_s, ref.vInf_km_s, 0.001, `${key} v∞`);
    near(out.log[0].pelletStream.launchEnergy_J, ref.launchEnergy_J, 0.01, `${key} launch KE`);
  }
  // Dividing the same stream into more pellets preserves total momentum.
  near(applyEvents(circular1AU, [{ ...pelletEvent, pelletCount: 20000, pelletMass_kg: 0.0001875 }]).totalDeltaV_km_s, 300, 1e-12);
  const zero = applyEvents(circular1AU, [{ ...pelletEvent, momentumEfficiency: 0 }]);
  assert.deepEqual(zero.finalState, applyEvents(circular1AU, []).finalState);
  assert.equal(zero.totalDeltaV_km_s, 0);
  near(applyEvents(circular1AU, [{ ...pelletEvent, momentumEfficiency: 1 }]).totalDeltaV_km_s, 375, 1e-12);
});

test('pellet impulses use local directions and compose with later events', () => {
  for (const direction of ['prograde', 'retrograde', 'radial', 'normal']) {
    const tail = { type: 'burn', deltaV_km_s: 1, direction: 'prograde' };
    const out = applyEvents(circular1AU, [{ ...pelletEvent, direction }, tail]);
    const expected = applyEvents(circular1AU, [{ type: 'burn', deltaV_km_s: 300, direction }, tail]);
    assert.deepEqual(out.finalState, expected.finalState);
    near(out.totalDeltaV_km_s, 301, 1e-12);
  }
});

test('pellet stream rejects invalid physical inputs and numerical overflow', () => {
  for (const key of ['pelletMass_kg', 'relativeVelocity_km_s', 'probeMass_kg']) {
    for (const value of [undefined, 0, -1, NaN, Infinity, '1']) {
      assert.throws(() => applyEvents(circular1AU, [{ ...pelletEvent, [key]: value }]), new RegExp(key));
    }
  }
  for (const pelletCount of [undefined, 0, -1, 1.5, NaN, Infinity, '10000', Number.MAX_SAFE_INTEGER + 1]) {
    assert.throws(() => applyEvents(circular1AU, [{ ...pelletEvent, pelletCount }]), /pelletCount/);
  }
  for (const momentumEfficiency of [undefined, -0.1, 1.1, NaN, Infinity, '0.8']) {
    assert.throws(() => applyEvents(circular1AU, [{ ...pelletEvent, momentumEfficiency }]), /momentumEfficiency/);
  }
  for (const direction of [undefined, 'inward']) {
    assert.throws(() => applyEvents(circular1AU, [{ ...pelletEvent, direction }]), /direction/);
  }
  assert.throws(() => applyEvents(circular1AU, [{ ...pelletEvent, pelletMass_kg: Number.MAX_VALUE }]), /overflow/);
  assert.throws(() => applyEvents(circular1AU, [{ ...pelletEvent, probeMass_kg: Number.MIN_VALUE }]), /overflow/);
});

// ---------- ionDrive ----------

const conceptE = JSON.parse(readFileSync(new URL('./scenarios/scenario-e.json', import.meta.url)));
const ionEvent = conceptE.events[0];
const ionReference = (ev) => JSON.parse(execFileSync('python3', ['-c', `
import contextlib, io, json, runpy, sys
with contextlib.redirect_stdout(io.StringIO()):
    calc = runpy.run_path(sys.argv[1])
ev = json.loads(sys.argv[2])
print(json.dumps(calc['po210_ion_drive'](ev['isp_s'], ev['power_W'], ev['halfLife_days'],
    ev['conversionEfficiency'], ev['thrusterEfficiency'], ev['wetMass_kg'], ev['dryMass_kg'])))
`, new URL('../../analysis/ideas_calc.py', import.meta.url).pathname, JSON.stringify(ev)], { encoding: 'utf8' }));

test('Concept E matches the Python Po-210 reference, rocket equation and 315–320 km/s escape', () => {
  const ref = ionReference(ionEvent);
  const out = applyTrajectory(conceptE);
  const drive = out.log[0].ionDrive;
  near(out.vInf_km_s, ref.vInf_km_s, 0.001, 'Python v∞ (rounded solar constants)');
  near(out.totalDeltaV_km_s, ref.deltaV_km_s, 1e-10, 'Python Δv');
  for (const key of ['exhaustSpeed_km_s', 'jetEnergy_J', 'initialJetPower_W',
    'propellantUsed_kg', 'finalMass_kg', 'initialAcceleration_m_s2']) {
    near(drive[key], ref[key], Math.max(1e-12, Math.abs(ref[key]) * 1e-14), key);
  }
  near(drive.jetEnergy_J, 2.08636761066495e11, 0.001);
  near(drive.exhaustSpeed_km_s, 322.983560778637, 1e-9);
  near(drive.initialJetPower_W, 12096, 1e-9);
  near(drive.propellantUsed_kg, 4, 1e-12);
  near(drive.finalMass_kg, 2.4, 1e-12);
  near(drive.initialAcceleration_m_s2, 0.0117033814, 1e-9);
  near(out.totalDeltaV_km_s, 316.791724653578, 1e-9);
  near(out.vInf_km_s, 315.388, 0.001);
  assert.ok(out.vInf_km_s >= 315 && out.vInf_km_s <= 320);
  near(out.vInf_km_s ** 2, out.totalDeltaV_km_s ** 2 - MU.Sun / AU_KM, 1e-9);
  near(out.finalState.v_km_s[0], out.totalDeltaV_km_s, 1e-10, 'radial thrust');
  near(out.finalState.v_km_s[1], circularSpeed(MU.Sun, AU_KM), 1e-10, 'tangential speed retained');
  assert.deepEqual(out.finalState.r_km, [AU_KM, 0, 0]);
  assert.match(drive.model, /equivalent impulse at start/);
});

test('ion drive caps propellant by decay energy and dry mass', () => {
  for (const [key, value] of [['power_W', ionEvent.power_W / 2],
    ['halfLife_days', ionEvent.halfLife_days / 2], ['conversionEfficiency', 0.15], ['thrusterEfficiency', 0.35],
    ['power_W', ionEvent.power_W * 2], ['isp_s', ionEvent.isp_s * 2]]) {
    const ev = { ...ionEvent, [key]: value };
    const ref = ionReference(ev);
    const out = applyEvents(circular1AU, [ev]);
    near(out.totalDeltaV_km_s, ref.deltaV_km_s, 1e-10, key);
    near(out.vInf_km_s, ref.vInf_km_s, 0.001, key);
    near(out.log[0].ionDrive.propellantUsed_kg, ref.propellantUsed_kg, 1e-12, key);
    assert.ok(out.log[0].ionDrive.finalMass_kg >= ionEvent.dryMass_kg);
  }
  const weak = applyEvents(circular1AU, [{ ...ionEvent, power_W: ionEvent.power_W / 2 }]);
  near(weak.log[0].ionDrive.propellantUsed_kg, 2, 1e-12);
  near(weak.log[0].ionDrive.finalMass_kg, 4.4, 1e-12);
});

test('ion drive uses local impulse directions and composes with later events', () => {
  const dv = applyEvents(circular1AU, [ionEvent]).totalDeltaV_km_s;
  for (const direction of ['prograde', 'retrograde', 'radial', 'normal']) {
    const out = applyEvents(circular1AU, [{ ...ionEvent, direction }, { type: 'burn', deltaV_km_s: 1, direction: 'prograde' }]);
    const expected = applyEvents(circular1AU, [{ type: 'burn', deltaV_km_s: dv, direction }, { type: 'burn', deltaV_km_s: 1, direction: 'prograde' }]);
    assert.deepEqual(out.finalState, expected.finalState);
    near(out.totalDeltaV_km_s, dv + 1, 1e-12);
  }
});

test('ion drive rejects invalid physical inputs and numerical overflow', () => {
  for (const key of ['isp_s', 'power_W', 'halfLife_days', 'wetMass_kg', 'dryMass_kg']) {
    for (const value of [undefined, 0, -1, NaN, Infinity, '1']) {
      assert.throws(() => applyEvents(circular1AU, [{ ...ionEvent, [key]: value }]), new RegExp(key));
    }
  }
  for (const key of ['conversionEfficiency', 'thrusterEfficiency']) {
    for (const value of [undefined, 0, -0.1, 1.1, NaN, Infinity, '0.3']) {
      assert.throws(() => applyEvents(circular1AU, [{ ...ionEvent, [key]: value }]), new RegExp(key));
    }
  }
  for (const dryMass_kg of [6.4, 7]) {
    assert.throws(() => applyEvents(circular1AU, [{ ...ionEvent, dryMass_kg }]), /wetMass_kg/);
  }
  for (const direction of [undefined, 'inward']) {
    assert.throws(() => applyEvents(circular1AU, [{ ...ionEvent, direction }]), /direction/);
  }
  assert.throws(() => applyEvents(circular1AU, [{ ...ionEvent, halfLife_days: Number.MAX_VALUE }]), /overflow/);
});

// ---------- laserCavityBoost ----------

test('Concept D matches the Python cavity reference and checked 306.9 km/s escape', () => {
  const doc = JSON.parse(readFileSync(new URL('./scenarios/scenario-d.json', import.meta.url)));
  const reference = JSON.parse(execFileSync('python3', ['-c', `
import contextlib, io, json, runpy, sys
with contextlib.redirect_stdout(io.StringIO()):
    calc = runpy.run_path(sys.argv[1])
ev = json.loads(sys.argv[2])
print(json.dumps(calc['laser_cavity_boost'](ev['power_MW'], ev['duration_s'], ev['recyclingFactor'], ev['probeMass_kg'])))
`, new URL('../../analysis/ideas_calc.py', import.meta.url).pathname, JSON.stringify(doc.events[0])], { encoding: 'utf8' }));
  const out = applyTrajectory(doc);
  const shot = out.log[0].laserCavity;
  // Python rounds c to 2.998e8 m/s and AU to 1.496e11 m; engine uses precise constants.
  near(out.vInf_km_s, reference.vInf_km_s, 0.01, 'Python v∞');
  near(out.totalDeltaV_km_s, reference.deltaV_km_s, 0.01, 'Python integrated Δv');
  near(shot.acceleration_m_s2, reference.acceleration_m_s2, 0.01, 'Python acceleration');
  near(shot.inputEnergy_J, reference.inputEnergy_J, 1e-3, 'Python energy');
  near(out.vInf_km_s, 306.9, 0.02);
  near(out.totalDeltaV_km_s, 280, 1e-10);
  near(shot.force_N, 784, 1e-9);
  near(shot.circulatingPower_MW / 1000, 117.52, 0.01);
  near(shot.acceleration_g, 40, 0.03);
  near(shot.boostDistance_km, 100000, 1e-8);
  near(shot.inputEnergy_J, 2.8e11, 2e8);
  near(out.log[0].before.r_AU, out.log[0].after.r_AU, 0, 'integrated at launch');
  near(out.log[0].after.speed_km_s, circularSpeed(MU.Sun, AU_KM) + 280, 1e-10);
  assert.equal(out.log[0].status, 'applied');
});

test('cavity thrust scales with power, duration, reflections and inverse mass in each local direction', () => {
  const shot = { type: 'laserCavityBoost', power_MW: 10, duration_s: 60, recyclingFactor: 20, probeMass_kg: 5, direction: 'prograde' };
  const baseline = applyEvents(circular1AU, [shot]).totalDeltaV_km_s;
  for (const [key, factor] of [['power_MW', 2], ['duration_s', 2], ['recyclingFactor', 2], ['probeMass_kg', 0.5]]) {
    near(applyEvents(circular1AU, [{ ...shot, [key]: shot[key] * factor }]).totalDeltaV_km_s, baseline * 2, 1e-12, key);
  }
  for (const direction of ['prograde', 'retrograde', 'radial', 'normal']) {
    const out = applyEvents(circular1AU, [{ ...shot, direction }]);
    const impulse = applyEvents(circular1AU, [{ type: 'burn', deltaV_km_s: baseline, direction }]);
    assert.deepEqual(out.finalState, impulse.finalState);
    assert.equal(out.sailBeta, 0);
  }
});

test('engine rejects invalid cavity inputs before applying thrust', () => {
  const shot = { type: 'laserCavityBoost', power_MW: 1, duration_s: 1, recyclingFactor: 1, probeMass_kg: 1, direction: 'prograde' };
  for (const key of ['power_MW', 'duration_s', 'probeMass_kg']) {
    for (const value of [undefined, 0, -1, NaN, Infinity, '1']) {
      assert.throws(() => applyEvents(circular1AU, [{ ...shot, [key]: value }]), new RegExp(key));
    }
  }
  for (const value of [undefined, 0.5, Infinity, '300']) {
    assert.throws(() => applyEvents(circular1AU, [{ ...shot, recyclingFactor: value }]), /recyclingFactor/);
  }
  for (const direction of [undefined, 'inward']) {
    assert.throws(() => applyEvents(circular1AU, [{ ...shot, direction }]), /direction/);
  }
});

// ---------- solarSail ----------

test('Concept B hybrid sail reproduces §3.3: 107.56 km/s at beta = 0.25', () => {
  const doc = JSON.parse(readFileSync(new URL('./scenarios/scenario-b.json', import.meta.url)));
  const out = applyTrajectory(doc, { ephemerisSamples: 64 });
  const kick = out.log[0];
  const sail = out.log[1];
  const r = sail.sail.radius_AU * AU_KM;
  const vp = kick.after.speed_km_s;
  near(out.vInf_km_s, 107.56, 0.01);
  near(out.vInf_km_s ** 2, vp ** 2 - 2 * (1 - 0.25) * MU.Sun / r, 1e-8);
  near(sail.after.speed_km_s, sail.before.speed_km_s, 0, 'deployment adds no velocity impulse');
  near(out.totalDeltaV_km_s, 6, 1e-9);
  near(out.fractionOfC, out.vInf_km_s / C_KM_S, 1e-15);
  near(out.gravityOnlySpecificEnergy_km2_s2 + sail.sail.remainingWork_km2_s2,
    out.specificEnergy_km2_s2, 1e-9, 'true energy plus sail work');
  near(sail.after.gravityOnlyVInf_km_s, 45.07, 0.01);
  near(out.effectiveMu_km3_s2, 0.75 * MU.Sun, 0);
  for (const point of out.ephemerisPoints) {
    const radius = Math.hypot(...point.r_AU) * AU_KM;
    const speed = Math.hypot(...point.v_km_s);
    near(speed ** 2 / 2 - MU.Sun / radius + 0.25 * MU.Sun / radius,
      out.specificEnergy_km2_s2, 1e-8, 'sampled sail energy is conserved');
  }
});

test('pure parabolic sundiver gives 97.66 km/s, while a bound inbound ellipse gives less', () => {
  const rp = 10 * 695700 / AU_KM;
  const parabolic = { e: 1, rp, nu: 0 };
  const out = applyEvents(parabolic, [{ type: 'solarSail', beta: 0.25 }]);
  near(out.vInf_km_s, 97.66, 0.01);
  near(out.vInf_km_s, Math.sqrt(0.25) * escapeSpeed(MU.Sun, rp * AU_KM), 1e-10);
  assert.equal(out.bound, false);
  assert.equal(out.totalDeltaV_km_s, 0);
  const doc = JSON.parse(readFileSync(new URL('./scenarios/scenario-b.json', import.meta.url)));
  const ellipse = applyEvents(doc.initialElements, [{ type: 'solarSail', beta: 0.25, location: 'perihelion' }]);
  near(ellipse.vInf_km_s ** 2, out.vInf_km_s ** 2 - MU.Sun / (doc.initialElements.a * AU_KM), 1e-8);
  assert.ok(ellipse.vInf_km_s < out.vInf_km_s);
});

test('sail starts at the event position and stays active across subsequent impulses', () => {
  const fall = { e: 1, rp: 0.1, nu: 60 };
  const initial = applyEvents(fall, []);
  const events = [{ type: 'solarSail', beta: 0.25 }, { type: 'burn', deltaV_km_s: 2, direction: 'prograde' }];
  const out = applyEvents(fall, events);
  const r = Math.hypot(...initial.finalState.r_km);
  const speed = Math.hypot(...initial.finalState.v_km_s);
  near(out.log[0].sail.radius_AU, r / AU_KM, 1e-12);
  near(out.log[0].after.vInf_km_s ** 2, 2 * 0.25 * MU.Sun / r, 1e-8);
  near(out.vInf_km_s ** 2, (speed + 2) ** 2 - 2 * 0.75 * MU.Sun / r, 1e-8);
  near(out.totalDeltaV_km_s, 2, 1e-12);
  assert.equal(out.sailBeta, 0.25);
  const sail = applyEvents(fall, events.slice(0, 1));
  const resumed = applyEvents(sail.finalElements, events.slice(1), { sailBeta: sail.sailBeta });
  near(resumed.vInf_km_s, out.vInf_km_s, 1e-9);
});

test('beta = 0 jettisons at a later position with only the finite sail work retained', () => {
  const fall = { e: 1, rp: 0.1, nu: 0 };
  const deploy = { type: 'solarSail', beta: 0.25 };
  const sail = applyEvents(fall, [deploy]);
  const coasting = applyEvents(fall, [deploy, { type: 'burn', deltaV_km_s: 0, location: 60 }]);
  const out = applyEvents(fall, [deploy, { type: 'solarSail', beta: 0, location: 60 }]);
  const rDeploy = 0.1 * AU_KM;
  const rJettison = out.log[1].sail.radius_AU * AU_KM;
  near(out.vInf_km_s ** 2, 2 * 0.25 * MU.Sun * (1 / rDeploy - 1 / rJettison), 1e-8);
  assert.ok(out.vInf_km_s < sail.vInf_km_s, 'future sail work is removed');
  assert.deepEqual(out.finalState, coasting.finalState, 'jettison preserves position and velocity');
  assert.equal(out.effectiveMu_km3_s2, MU.Sun);
  assert.equal(out.sailBeta, 0);
  assert.equal(out.totalDeltaV_km_s, 0);
  near(out.specificEnergy_km2_s2, out.gravityOnlySpecificEnergy_km2_s2, 1e-9);
});

test('zero beta is a no-op, beta changes replace rather than stack, and sails can remain bound', () => {
  const initial = applyEvents(circular1AU, []);
  const zero = applyEvents(circular1AU, [{ type: 'solarSail', beta: 0 }]);
  assert.deepEqual(zero.finalState, initial.finalState);
  assert.deepEqual(zero.finalElements, initial.finalElements);
  assert.equal(zero.vInf_km_s, null);
  const active = applyEvents(circular1AU, [{ type: 'solarSail', beta: 0.25 }]);
  assert.equal(active.bound, true);
  assert.equal(active.vInf_km_s, null);
  assert.equal(active.fractionOfC, null);
  const par = applyEvents(circular1AU, [{ type: 'solarSail', beta: 0.5 }]);
  assert.equal(par.bound, false);
  assert.equal(par.vInf_km_s, 0);
  const events = [0.25, 0.25, 0.5, 0].map(beta => ({ type: 'solarSail', beta }));
  const out = applyEvents(circular1AU, events);
  near(out.log[0].after.a_AU, out.log[1].after.a_AU, 0);
  assert.deepEqual(out.finalState, initial.finalState);
  assert.deepEqual(out.finalElements, initial.finalElements);
});

test('sail affects probe motion but flyby body velocity uses true solar gravity', () => {
  const out = applyEvents({ a: 3.5, e: 5 / 7 }, [
    { type: 'solarSail', beta: 0.25 },
    { type: 'gravityAssist', body: 'Jupiter', periapsis_km: 5e6 }
  ]);
  assert.equal(out.log[1].status, 'applied');
  const fb = out.log[1].flyby;
  near(Math.hypot(...fb.bodyVelocity_km_s), circularSpeed(MU.Sun, fb.encounterRadius_AU * AU_KM), 1e-12);
  assert.equal(out.sailBeta, 0.25);
  assert.equal(out.totalDeltaV_km_s, 0);
});

test('solar sail rejects invalid lightness numbers and non-solar central bodies', () => {
  for (const beta of [undefined, null, -1, 1, 1.1, Infinity, NaN, '0.25']) {
    assert.throws(() => applyEvents(circular1AU, [{ type: 'solarSail', beta }]), /beta/);
  }
  assert.throws(() => applyEvents(circular1AU, [{ type: 'solarSail', beta: 0.25 }], { centralBody: 'Earth' }), /Sun/);
  assert.throws(() => applyEvents(circular1AU, [], { sailBeta: 1 }), /beta/);
  const customMu = MU.Sun * 2;
  const out = applyEvents({ e: 1, rp: 0.1 }, [{ type: 'solarSail', beta: 0.25 }], { mu: customMu });
  near(out.vInf_km_s ** 2, 2 * 0.25 * customMu / (0.1 * AU_KM), 1e-8);
});

test('vis-viva: circular speed at 1 AU ≈ 29.78 km/s', () => {
  // sqrt(1.32712440018e11 / 1.495978707e8) = sqrt(887.13) = 29.785
  near(visViva(MU.Sun, AU_KM, AU_KM), 29.7847, 1e-3);
  near(circularSpeed(MU.Sun, AU_KM), 29.7847, 1e-3);
});

test('vis-viva: elliptic and hyperbolic (a < 0)', () => {
  // Hohmann Earth→Mars ellipse, a = (1 + 1.524)/2 = 1.262 AU, at r = 1 AU:
  // v = 29.785 * sqrt(2 − 1/1.262) = 29.785 * 1.0989 = 32.73 km/s
  near(visViva(MU.Sun, AU_KM, 1.262 * AU_KM), 32.73, 0.01);
  // Hyperbola with a = −1 AU at r = 1 AU: v = 29.785 * sqrt(3) = 51.59 km/s
  near(visViva(MU.Sun, AU_KM, -AU_KM), 51.589, 1e-3);
  // Parabola (a = ∞) gives escape speed: 29.785 * sqrt(2) = 42.122 km/s
  near(visViva(MU.Sun, AU_KM, Infinity), 42.122, 1e-3);
  near(escapeSpeed(MU.Sun, AU_KM), 42.122, 1e-3);
  assert.throws(() => visViva(MU.Sun, 3 * AU_KM, AU_KM), RangeError);
});

test('vInfinity: null when bound, 0 when parabolic, sqrt(v² − v_esc²) otherwise', () => {
  assert.equal(vInfinity(MU.Sun, AU_KM, 30), null);
  assert.equal(vInfinity(MU.Sun, AU_KM, escapeSpeed(MU.Sun, AU_KM)), 0);
  // sqrt(51.589² − 42.122²) = sqrt(2661.4 − 1774.3) = 29.785
  near(vInfinity(MU.Sun, AU_KM, visViva(MU.Sun, AU_KM, -AU_KM)), 29.785, 1e-3);
});

test('elements ↔ state round trip (elliptic inclined, hyperbolic, parabolic)', () => {
  const cases = [
    { p: 1.2 * AU_KM * (1 - 0.3 ** 2), e: 0.3, i: 0.4, raan: 1.1, argp: 2.0, nu: -0.7 },
    { p: 0.5 * AU_KM * (2.5 ** 2 - 1), e: 2.5, i: 2.9, raan: 5.0, argp: 0.3, nu: 1.0 },
    { p: 0.2 * AU_KM, e: 1, i: 0.1, raan: 0.2, argp: 0.3, nu: 0.5 }
  ];
  for (const k of cases) {
    const { r, v } = elementsToState(k, MU.Sun);
    const back = stateToElements(r, v, MU.Sun);
    for (const key of ['e', 'i', 'raan', 'argp', 'nu']) {
      near(back[key], k[key], 1e-9, key);
    }
    near(back.p / k.p, 1, 1e-12, 'p');
  }
});

test('bound orbit after a small burn reports vInf = null and fractionOfC = null', () => {
  const out = applyEvents(circular1AU, [{ type: 'burn', deltaV_km_s: 3, direction: 'prograde' }]);
  assert.equal(out.bound, true);
  assert.equal(out.vInf_km_s, null);
  assert.equal(out.asymptoticSpeed_km_s, null);
  assert.equal(out.fractionOfC, null);
  near(out.totalDeltaV_km_s, 3, 1e-12);
});

test('prograde burn reshapes the orbit: Hohmann departure to Mars distance', () => {
  // Transfer ellipse 1 → 1.524 AU needs v_p = 32.73 km/s, i.e. Δv ≈ 2.95 km/s.
  const target = 1.524;
  const vp = visViva(MU.Sun, AU_KM, ((1 + target) / 2) * AU_KM);
  const dv = vp - circularSpeed(MU.Sun, AU_KM);
  near(dv, 2.95, 0.01);
  const out = applyEvents(circular1AU, [{ type: 'burn', deltaV_km_s: dv }]);
  const el = out.finalElements;
  near(el.a, (1 + target) / 2, 1e-9);
  near(el.e, (target - 1) / (target + 1), 1e-9);
  near(el.rp, 1, 1e-9);
  near(el.nu, 0, 1e-6, 'burn point becomes perihelion');
});

test('retrograde burn at aphelion lowers perihelion; normal burn tilts the plane', () => {
  const ellipse = { a: 1.262, e: 0.2076, units: { a: 'AU', angles: 'deg' } };
  const lowered = applyEvents(ellipse, [
    { type: 'burn', location: 'aphelion', deltaV_km_s: 2, direction: 'retrograde' }
  ]);
  assert.ok(lowered.finalElements.rp < 1, 'perihelion dropped');
  near(lowered.finalElements.rp + 0, lowered.finalElements.a * (1 - lowered.finalElements.e), 1e-9);

  // Pure normal Δv on a circular orbit: tan(Δi) = Δv / v_c.
  const tilted = applyEvents(circular1AU, [{ type: 'burn', deltaV_km_s: 1, direction: 'normal' }]);
  near(tilted.finalElements.i, Math.atan(1 / 29.7847) * (180 / Math.PI), 1e-3);
});

test('vector Δv [V, N, C] in VNC frame matches named direction', () => {
  const a = applyEvents(circular1AU, [{ type: 'burn', deltaV: [0.5, 0, 0], units: 'km/s' }]);
  const b = applyEvents(circular1AU, [{ type: 'burn', deltaV_km_s: 0.5, direction: 'prograde' }]);
  near(a.finalElements.a, b.finalElements.a, 1e-12);
  const c = applyEvents(circular1AU, [{ type: 'burn', deltaV: [500, 0, 0], units: 'm/s' }]);
  near(c.finalElements.a, b.finalElements.a, 1e-12);
});

test('Earth escape sanity: 200 km LEO', () => {
  // r = 6378.137 + 200 = 6578.137 km
  // v_c = sqrt(398600.4418 / 6578.137) = sqrt(60.595) = 7.784 km/s, v_esc = 11.009 km/s
  const r = 6578.137;
  const leo = { a: r, e: 0, units: { a: 'km', angles: 'deg' } };
  near(circularSpeed(MU.Earth, r), 7.784, 1e-3);
  near(escapeSpeed(MU.Earth, r), 11.009, 1e-3);

  // Δv = 3.0 km/s → v = 10.784 < 11.009: still bound.
  const short = applyEvents(leo, [{ type: 'burn', deltaV_km_s: 3 }], { centralBody: 'Earth' });
  assert.equal(short.bound, true);

  // Δv = 3.5 km/s → v = 11.284: v∞ = sqrt(11.284² − 2·60.595) = sqrt(127.335 − 121.190) ≈ 2.479
  const esc = applyEvents(leo, [{ type: 'burn', deltaV_km_s: 3.5 }], { centralBody: 'Earth' });
  assert.equal(esc.bound, false);
  near(esc.vInf_km_s, 2.479, 1e-3);
  assert.ok(esc.finalElements.a < 0 && esc.finalElements.e > 1, 'hyperbolic elements');
});

test('solar escape sanity from a 1 AU circular orbit', () => {
  // Exactly (√2 − 1)·v_c = 12.337 km/s reaches a parabola: v∞ = 0.
  const dvEsc = (Math.SQRT2 - 1) * circularSpeed(MU.Sun, AU_KM);
  near(dvEsc, 12.337, 1e-3);
  const par = applyEvents(circular1AU, [{ type: 'burn', deltaV_km_s: dvEsc }]);
  assert.equal(par.bound, false);
  assert.equal(par.vInf_km_s, 0);
  assert.equal(par.finalElements.a, null, 'parabola has a = ∞ → null');
  near(par.finalElements.e, 1, 1e-9);

  // 15 km/s: v = 44.785, v∞ = sqrt(44.785² − 42.122²) = sqrt(2005.7 − 1774.3) ≈ 15.21
  const hyp = applyEvents(circular1AU, [{ type: 'burn', deltaV_km_s: 15 }]);
  near(hyp.vInf_km_s, 15.21, 0.01);
  near(hyp.fractionOfC, hyp.vInf_km_s / C_KM_S, 1e-15);
});

test('Oberth: parabolic fall to 0.1 AU, then 5 km/s prograde at perihelion', () => {
  // v_esc(0.1 AU) = 42.122 * sqrt(10) = 133.20 km/s; parabolic v_p = v_esc.
  // v∞ = sqrt((133.20 + 5)² − 133.20²) = sqrt(2·133.20·5 + 25) = sqrt(1357.0) ≈ 36.84 km/s
  const fall = { type: 'keplerian', e: 1, rp: 0.1, nu: -90, units: { a: 'AU', angles: 'deg' } };
  const out = applyEvents(fall, [
    { id: 'dive', type: 'oberthBurn', perihelion_AU: 0.1, deltaV_km_s: 5 }
  ]);
  const vesc = escapeSpeed(MU.Sun, 0.1 * AU_KM);
  near(vesc, 133.20, 0.01);
  near(out.vInf_km_s, 36.84, 0.01);
  near(out.vInf_km_s, Math.sqrt((vesc + 5) ** 2 - vesc ** 2), 1e-9);
  near(out.log[0].oberth.analyticVInf_km_s, out.vInf_km_s, 1e-9);
  near(out.log[0].oberth.burnRadius_AU, 0.1, 1e-12);
  assert.equal(out.log[0].perihelionAdjust, undefined, 'already at target perihelion');
  near(out.totalDeltaV_km_s, 5, 1e-12);

  // Same 5 km/s on a parabola at 1 AU: sqrt(2·42.122·5 + 25) = sqrt(446.2) ≈ 21.12
  // km/s — burning 10× deeper yields ≈ 10^(1/4) ≈ 1.74× more v∞.
  const shallow = applyEvents({ e: 1, rp: 1 }, [{ type: 'oberthBurn', deltaV_km_s: 5 }]);
  near(shallow.vInf_km_s, 21.12, 0.01);
  assert.ok(out.vInf_km_s > 1.7 * shallow.vInf_km_s);

  // Analytic helper agrees and has no fake 2/sqrt(r) multiplier.
  near(oberthVInf(MU.Sun, 0.1 * AU_KM, vesc, 5), 36.84, 0.01);
});

test('oberthBurn with perihelion_AU retargets perihelion at aphelion and counts that Δv', () => {
  // Start on a 1 AU circle: dropping perihelion to 0.1 AU
  // needs v = sqrt(μ·(2/r − 2/(1.1 AU))) = 29.785·sqrt(2 − 1.818) = 12.70 km/s,
  // so Δv ≈ −17.08 km/s (retrograde).
  const out = applyEvents(circular1AU, [
    { type: 'oberthBurn', perihelion_AU: 0.1, deltaV_km_s: 5 }
  ]);
  const adj = out.log[0].perihelionAdjust;
  near(adj.toRp_AU, 0.1, 0);
  near(adj.deltaV_km_s, -17.08, 0.01);
  near(out.log[0].oberth.burnRadius_AU, 0.1, 1e-9);
  near(out.totalDeltaV_km_s, 17.08 + 5, 0.01);
  // At 0.1 AU on that ellipse v_p = 29.785·sqrt(20 − 1.818) = 127.0 km/s;
  // +5 → 132.0 < v_esc 133.2: still bound.
  near(out.log[0].oberth.vBefore_km_s, 127.0, 0.05);
  assert.equal(out.bound, true);
});

test('unsupported event types pass through with a warning and no state change', () => {
  const out = applyEvents(circular1AU, [
    { id: 'h', type: 'hitchhike', deltaV_km_s: 2.5 },
    { id: 'x', type: 'warpDrive' }
  ]);
  assert.deepEqual(out.log.map((e) => e.status), ['skipped', 'skipped']);
  assert.match(out.log[0].warnings[0], /not modelled yet/);
  assert.match(out.log[1].warnings[0], /unknown event type/);
  near(out.finalElements.a, 1, 1e-12);
  assert.equal(out.totalDeltaV_km_s, 0);
});

test('impossible burn locations fall back to current position with a warning', () => {
  const hyp = { a: -1, e: 1.5, nu: 30, units: { a: 'AU', angles: 'deg' } };
  const out = applyEvents(hyp, [
    { type: 'burn', location: 'aphelion', deltaV_km_s: 1 },
    { type: 'burn', location: 'perihelion', deltaV_km_s: 1 }
  ]);
  assert.match(out.log[0].warnings[0], /no aphelion/);
  assert.match(out.log[1].warnings[0], /outbound/);
});

test('schema-example.json runs end to end and samples an ephemeris', () => {
  const doc = JSON.parse(readFileSync(new URL('./schema-example.json', import.meta.url), 'utf8'));
  const out = applyTrajectory(doc, { ephemerisSamples: 16 });
  assert.equal(out.log.length, doc.events.length);
  assert.deepEqual(out.log.map((e) => e.status), ['applied', 'applied', 'applied', 'skipped', 'applied']);
  near(out.log[2].tether.payloadDeltaV_km_s, 2.5, 1e-12);
  assert.deepEqual(out.log[4].warnings, [], 'Jupiter assist is self-consistent');
  near(out.log[4].flyby.periapsis_km, 100000, 0);
  assert.ok(out.log[1].perihelionAdjust, 'Oberth event retargets perihelion to 0.1 AU');
  near(out.log[1].oberth.burnRadius_AU, 0.1, 1e-9);
  assert.equal(out.ephemerisPoints.length, 16);
  for (const p of out.ephemerisPoints) {
    assert.equal(p.r_AU.length, 3);
    assert.ok(p.r_AU.every(Number.isFinite));
  }
  assert.ok(Number.isFinite(out.totalDeltaV_km_s));
});

test('hyperbolic ephemeris stays inside the asymptotes and radius cap', () => {
  const out = applyEvents(circular1AU, [{ type: 'burn', deltaV_km_s: 20 }], {
    ephemerisSamples: 50,
    ephemerisMaxRadius_AU: 30
  });
  for (const p of out.ephemerisPoints) {
    const r = Math.hypot(...p.r_AU);
    assert.ok(r <= 30 * (1 + 1e-9), `r = ${r}`);
  }
});

test('input validation', () => {
  assert.throws(() => applyEvents({ a: 1, e: 1.2 }, []), /hyperbolic orbits need a < 0/);
  assert.throws(() => applyEvents({ a: 1, e: 1 }, []), /parabolic elements need "rp"/);
  assert.throws(() => applyEvents({ type: 'cartesian', r: [1, 0, 0] }, []), /unsupported element type/);
  assert.throws(() => applyEvents(circular1AU, [], { centralBody: 'Vulcan' }), /unknown central body/);
});

// ---------- gravityAssist ----------

test('flyby turn angle δ = 2·asin(1/(1 + r_p v∞²/μ)): exact cases and Jupiter at 5 R♃', () => {
  const D = 180 / Math.PI;
  // r_p = μ/v∞² → e = 2 → δ = 2·asin(1/2) = 60°.
  near(flybyTurnAngle(MU.Jupiter, MU.Jupiter / 100, 10) * D, 60, 1e-12);
  // r_p = (√2 − 1)μ/v∞² → e = √2 → δ = 2·45° = 90°.
  near(flybyTurnAngle(MU.Jupiter, ((Math.SQRT2 - 1) * MU.Jupiter) / 100, 10) * D, 90, 1e-12);
  // v∞ = 10 km/s, r_p = 5·71492 = 357460 km:
  // e = 1 + 357460·100 / 1.26686534e8 = 1.28216, 1/e = 0.77994, asin = 51.254°, δ ≈ 102.51°
  near(flybyTurnAngle(MU.Jupiter, 5 * 71492, 10) * D, 102.51, 0.01);
});

test('powered flyby: periapsis burn raises v∞ and the turn angle splits across both legs', () => {
  const rp = MU.Jupiter / 100; // e_in = 2 at v∞ = 10 km/s
  const free = poweredFlyby(MU.Jupiter, rp, 10, 0);
  near(free.vInfOut, 10, 1e-12);
  near(free.turnAngle, flybyTurnAngle(MU.Jupiter, rp, 10), 1e-12);
  // v_esc² at r_p = 2μ/r_p = 200, v_p,in = sqrt(100 + 200) = 17.3205
  // +1 km/s → 18.3205, v∞,out = sqrt(335.641 − 200) = 11.6465
  // e_out = 1 + 135.641/100 = 2.35641, δ = 30° + asin(0.42437) = 30° + 25.11° = 55.11°
  const pf = poweredFlyby(MU.Jupiter, rp, 10, 1);
  near(pf.vpIn, 17.3205, 1e-4);
  near(pf.vInfOut, 11.6465, 1e-4);
  near(pf.eOut, 2.35641, 1e-5);
  near((pf.turnAngle * 180) / Math.PI, 55.11, 0.01);
  // A −10 km/s burn drops v_p to 7.32 < v_esc 14.14: captured.
  assert.equal(poweredFlyby(MU.Jupiter, rp, 10, -10), null);
});

// Hohmann transfer 1 AU → a♃: v_p = 38.5774, v_a = 7.4146 km/s; Jupiter's circular
// speed is 13.0578 km/s, so at aphelion v∞,in = 13.0578 − 7.4146 = 5.6432 km/s (tangential).
const aHohmann = ((1 + 5.202887) / 2) * AU_KM;
const hohmannDv = visViva(MU.Sun, AU_KM, aHohmann) - circularSpeed(MU.Sun, AU_KM);
const vInfJ = circularSpeed(MU.Sun, 5.202887 * AU_KM) - visViva(MU.Sun, 5.202887 * AU_KM, aHohmann);

test('gravityAssist: Hohmann arrival at Jupiter, 60° turn, heliocentric Δv = v∞', () => {
  near(hohmannDv, 8.7927, 1e-4);
  near(vInfJ, 5.6432, 1e-4);
  const rp = MU.Jupiter / vInfJ ** 2; // e = 2 → δ = 60°, r_p ≈ 3.98e6 km ≈ 55.6 R♃
  const out = applyEvents(circular1AU, [
    { type: 'burn', deltaV_km_s: hohmannDv },
    { id: 'jga', type: 'gravityAssist', body: 'Jupiter', periapsisAltitude_km: rp - 71492 }
  ]);
  const fb = out.log[1].flyby;
  assert.equal(out.log[1].status, 'applied');
  near(fb.encounterRadius_AU, 5.202887, 1e-9, 'moved to aphelion = Jupiter orbit');
  near(fb.periapsis_km, rp, 1e-6);
  near(fb.vInfIn_km_s, 5.6432, 1e-4);
  near(fb.vInfOut_km_s, fb.vInfIn_km_s, 1e-12);
  near(fb.eccentricityIn, 2, 1e-9);
  near(fb.turnAngle_deg, 60, 1e-6);
  // Unpowered: |Δv_helio| = 2 v∞ sin(δ/2) = v∞ for δ = 60°.
  near(fb.heliocentricDeltaV_km_s, 5.6432, 1e-4);
  // Law of cosines: sqrt(13.0578² + 5.6432² − 2·13.0578·5.6432·cos 60°) = 11.3430 km/s
  near(fb.heliocentricSpeedAfter_km_s, 11.3430, 1e-4);
  // v∞ relative to the planet is conserved by an unpowered flyby.
  const vRel = Math.hypot(...out.finalState.v_km_s.map((x, j) => x - fb.bodyVelocity_km_s[j]));
  near(vRel, vInfJ, 1e-9);
  // Gravity is free: only the departure burn counts.
  near(out.totalDeltaV_km_s, hohmannDv, 1e-12);
});

test('gravityAssist: powered flyby adds periapsis Δv to the budget', () => {
  const rp = MU.Jupiter / vInfJ ** 2;
  const out = applyEvents(circular1AU, [
    { type: 'burn', deltaV_km_s: hohmannDv },
    { type: 'gravityAssist', body: 'Jupiter', periapsis_km: rp, deltaV_km_s: 1, direction: 'prograde' }
  ]);
  const fb = out.log[1].flyby;
  // v_esc² = 2v∞² at this r_p, so v_p,in = √3·5.6432 = 9.7743;
  // +1 → v∞,out = sqrt(10.7743² − 2·5.6432²) = sqrt(116.085 − 63.691) = 7.238
  near(fb.periapsisSpeedIn_km_s, 9.7743, 1e-4);
  near(fb.vInfOut_km_s, 7.238, 1e-3);
  near(fb.vInfOut_km_s, poweredFlyby(MU.Jupiter, rp, vInfJ, 1).vInfOut, 1e-9);
  near(out.totalDeltaV_km_s, hohmannDv + 1, 1e-12);
});

test('gravityAssist: trailing pass gains heliocentric energy, leading pass loses it', () => {
  // Ellipse 1 → 6 AU crosses Jupiter's orbit at ν ≠ 180°, so v∞,in has a radial part.
  // There v∞,in = 7.8937 km/s; r_p = 5e6 km gives e = 1 + 5e6·62.31/1.26687e8 = 3.4593,
  // δ = 2·asin(0.28908) = 33.61°, small enough that the leading turn moves v∞ away from v♃.
  // (With δ ≳ 100° a "leading" turn can swing past anti-v♃ and still gain energy.)
  const ellipse = { a: 3.5, e: 5 / 7, units: { a: 'AU', angles: 'deg' } };
  const ga = (extra) => applyEvents(ellipse, [
    { type: 'gravityAssist', body: 'Jupiter', periapsis_km: 5e6, ...extra }
  ]);
  const trailing = ga({});
  const leading = ga({ side: 'leading' });
  const before = trailing.log[0].flyby.heliocentricSpeedBefore_km_s;
  near(trailing.log[0].flyby.encounterRadius_AU, 5.202887, 1e-9);
  near(trailing.log[0].flyby.turnAngle_deg, 33.6, 0.01);
  assert.ok(trailing.log[0].after.speed_km_s > before, 'trailing gains');
  assert.ok(leading.log[0].after.speed_km_s < before, 'leading loses');
  near(trailing.log[0].flyby.turnAngle_deg, leading.log[0].flyby.turnAngle_deg, 1e-12);
  assert.ok(trailing.finalElements.a > 3.5);
  assert.ok(leading.finalElements.a < 3.5);
  // bPlaneAngle 90° turns v∞ out of the ecliptic.
  const tilted = ga({ bPlaneAngle_deg: 90 });
  assert.ok(tilted.finalElements.i > 1, `i = ${tilted.finalElements.i}°`);
});

test('gravityAssist: unreachable planet or capture is skipped with no state change', () => {
  const miss = applyEvents(circular1AU, [
    { type: 'gravityAssist', body: 'Jupiter', periapsisAltitude_km: 1e5 }
  ]);
  assert.equal(miss.log[0].status, 'skipped');
  assert.match(miss.log[0].warnings[0], /does not reach/);
  near(miss.finalElements.a, 1, 1e-12);

  const capture = applyEvents(circular1AU, [
    { type: 'burn', deltaV_km_s: hohmannDv },
    { type: 'gravityAssist', body: 'Jupiter', periapsisAltitude_km: 1e5, deltaV_km_s: 20, direction: 'retrograde' }
  ]);
  assert.equal(capture.log[1].status, 'skipped');
  assert.match(capture.log[1].warnings[0], /captures/);
  near(capture.finalElements.a, (1 + 5.202887) / 2, 1e-9);
  near(capture.totalDeltaV_km_s, hohmannDv, 1e-12);

  assert.throws(
    () => applyEvents(circular1AU, [{ type: 'gravityAssist', body: 'Vulcan', periapsis_km: 1 }]),
    /unknown flyby body/
  );
  assert.throws(
    () => applyEvents(circular1AU, [{ type: 'gravityAssist', body: 'Jupiter' }]),
    /needs periapsis_km, periapsisAltitude_km or turnAngle_deg/
  );
});

test('gravityAssist: turnAngle_deg alone solves r_p; with periapsis it is a consistency check', () => {
  // δ = 60° → r_p = μ/v∞² · (1/sin 30° − 1) = μ/v∞² = 1.26686534e8 / 5.6432² ≈ 3.978e6 km
  const out = applyEvents(circular1AU, [
    { type: 'burn', deltaV_km_s: hohmannDv },
    { type: 'gravityAssist', body: 'Jupiter', turnAngle_deg: 60 }
  ]);
  near(out.log[1].flyby.periapsis_km / 3.978e6, 1, 1e-3);
  near(out.log[1].flyby.periapsis_km, MU.Jupiter / vInfJ ** 2, 1e-3);
  near(out.log[1].flyby.turnAngle_deg, 60, 1e-9);

  const mismatch = applyEvents(circular1AU, [
    { type: 'burn', deltaV_km_s: hohmannDv },
    { type: 'gravityAssist', body: 'Jupiter', periapsis_km: MU.Jupiter / vInfJ ** 2, turnAngle_deg: 30 }
  ]);
  assert.match(mismatch.log[1].warnings[0], /does not match 60\.0000°/);
  near(mismatch.log[1].flyby.turnAngle_deg, 60, 1e-9);
});

// ---------- tetherRelease ----------

test('tether Δv: rigid tether, momentum split by mass ratio', () => {
  near(tetherDeltaV(2), 2, 0, 'infinitely heavy facility');
  // M/m = 9: Δv_payload = 2·9/10 = 1.8 km/s (facility recoils −1.8/9 = −0.2 km/s)
  near(tetherDeltaV(2, 9), 1.8, 1e-12);
  assert.throws(() => tetherDeltaV(2, 0), RangeError);
});

test('tetherRelease: prograde release from 1 AU circle equals a 1.8 km/s burn', () => {
  const out = applyEvents(circular1AU, [
    { id: 't', type: 'tetherRelease', tipSpeed_km_s: 2, massRatio: 9 }
  ]);
  const t = out.log[0].tether;
  near(t.payloadDeltaV_km_s, 1.8, 1e-12);
  near(t.facilityRecoil_km_s, -0.2, 1e-12);
  // 29.7847 + 1.8 = 31.5847 km/s; a = 1 / (2 − (31.5847/29.7847)²) = 1 / (2 − 1.12452) = 1.1422 AU
  near(out.log[0].after.speed_km_s, 31.5847, 1e-4);
  near(out.finalElements.a, 1.1422, 1e-4);
  near(out.totalDeltaV_km_s, 1.8, 1e-12);
  const burn = applyEvents(circular1AU, [{ type: 'burn', deltaV_km_s: 1.8 }]);
  near(out.finalElements.a, burn.finalElements.a, 1e-12);
});

test('tetherRelease: tip speed from length and period, release point and direction', () => {
  // L = 100 km, T = 100π s → tip = 2π·100/(100π) = 2 km/s;
  // heavy facility → accel = v²/L = 0.04 km/s² = 40 m/s² = 4.079 g
  const ellipse = { a: 1.262, e: 0.2076, nu: 40, units: { a: 'AU', angles: 'deg' } };
  const out = applyEvents(ellipse, [
    {
      type: 'tetherRelease',
      tetherLength_km: 100,
      rotationPeriod_s: 100 * Math.PI,
      location: 'aphelion',
      direction: 'retrograde'
    }
  ]);
  const t = out.log[0].tether;
  near(t.tipSpeed_km_s, 2, 1e-12);
  near(t.payloadAcceleration_g, 4.079, 1e-3);
  assert.equal(t.direction, 'retrograde');
  const burn = applyEvents(ellipse, [
    { type: 'burn', location: 'aphelion', deltaV_km_s: 2, direction: 'retrograde' }
  ]);
  near(out.finalElements.rp, burn.finalElements.rp, 1e-12);
  assert.ok(out.finalElements.rp < 1, 'retrograde release at aphelion lowers perihelion');
});

test('tetherRelease: direct deltaV_km_s form and input validation', () => {
  const out = applyEvents(circular1AU, [{ type: 'tetherRelease', deltaV_km_s: 2.5, massRatio: 50 }]);
  near(out.log[0].tether.payloadDeltaV_km_s, 2.5, 1e-12);
  near(out.log[0].tether.facilityRecoil_km_s, -0.05, 1e-12);
  const both = applyEvents(circular1AU, [{ type: 'tetherRelease', tipSpeed_km_s: 1, deltaV_km_s: 5 }]);
  near(both.totalDeltaV_km_s, 1, 1e-12);
  assert.match(both.log[0].warnings[0], /ignoring deltaV_km_s/);
  assert.throws(() => applyEvents(circular1AU, [{ type: 'tetherRelease' }]), /tetherRelease needs/);
  assert.throws(
    () => applyEvents(circular1AU, [{ type: 'tetherRelease', tipSpeed_km_s: 1, massRatio: -1 }]),
    RangeError
  );
});
