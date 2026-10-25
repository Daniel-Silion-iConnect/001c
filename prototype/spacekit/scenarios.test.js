// Reference concepts and Voyager baselines: schema validity, engine/viewer runs,
// agreement with documented speeds, and speed-ranked picker defaults.
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { test } from 'node:test';
import { validateTrajectory } from '../../scripts/validate-schema.mjs';
import { applyTrajectory, AU_KM } from './engine.js';
import { buildTrajectory } from './viewer-data.js';
import { pickerOptions, selectScenario } from './scenario-picker.js';

const dir = new URL('./scenarios/', import.meta.url);
const readJson = async (url) => JSON.parse(await readFile(url, 'utf8'));
const index = await readJson(new URL('index.json', dir));
const scenarios = Object.fromEntries(await Promise.all(index.map(async (entry) => [entry.id, await readJson(new URL(entry.file, dir))])));

const RSUN_AU = 695700 / AU_KM;
const close = (actual, expected, tol, what) =>
  assert.ok(Math.abs(actual - expected) <= tol, `${what}: ${actual} vs ${expected} (±${tol})`);

test('index.json lists every scenario file once with id/name/file/summary', async () => {
  const files = (await readdir(dir)).filter((f) => f !== 'index.json' && f.endsWith('.json')).sort();
  assert.deepEqual(index.map((e) => e.file).sort(), files);
  assert.equal(new Set(index.map((e) => e.id)).size, index.length);
  for (const entry of index) {
    assert.deepEqual(Object.keys(entry).sort(), entry.category === 'exotic'
      ? ['category', 'feasibility', 'file', 'id', 'name', 'showstopper', 'summary']
      : ['file', 'id', 'name', 'summary']);
    for (const key of Object.keys(entry)) assert.ok(typeof entry[key] === 'string' && entry[key].trim(), `${entry.id}.${key}`);
    assert.equal(scenarios[entry.id].name, entry.name);
  }
});

for (const entry of index) {
  test(`${entry.id} validates against the trajectory schema`, () => {
    assert.ok(validateTrajectory(scenarios[entry.id]), JSON.stringify(validateTrajectory.errors));
  });

  test(`${entry.id} runs through the engine and the viewer cleanly`, () => {
    const doc = scenarios[entry.id];
    const out = applyTrajectory(doc);
    assert.equal(out.bound, false);
    for (const e of out.log) {
      assert.equal(e.status, 'applied', `${e.id} skipped`);
      assert.deepEqual(e.warnings, [], `${e.id} warnings`);
      assert.equal(e.perihelionAdjust, undefined, `${e.id}: perihelion_AU must match the initial conic exactly`);
    }
    const viewer = buildTrajectory(doc);
    close(viewer.result.vInf_km_s, out.vInf_km_s, 1e-6, 'viewer leg-by-leg v∞');
    close(viewer.result.totalDeltaV_km_s, out.totalDeltaV_km_s, 1e-9, 'viewer Δv');
  });
}

// Perihelion state just before the Oberth burn, from the engine log.
const oberth = (out) => out.log.find((e) => e.type === 'oberthBurn').oberth;

test('concept A baseline matches §2.3', () => {
  const doc = scenarios['concept-a-baseline'];
  const out = applyTrajectory(doc);
  const o = oberth(out);
  close(o.burnRadius_AU / RSUN_AU, 6.0, 1e-9, 'r_p (R_sun)');
  close(o.vEsc_km_s, 252.16, 0.01, 'v_esc');
  close(o.vBefore_km_s, 251.49, 0.01, 'v_p-');
  close(o.analyticVInf_km_s, 76.42, 0.01, 'v∞,SOM');
  close(out.log[0].after.vInf_km_s, 76.42, 0.01, 'engine v∞ after burn');
  const tethers = doc.events.filter((e) => e.type === 'tetherRelease');
  assert.equal(tethers.length, 12);
  close(tethers.reduce((s, e) => s + e.deltaV_km_s, 0), 36.0, 1e-12, 'Σ tether Δv');
  // Far-field tethers (10–30 AU) add almost linearly: slightly above the Regime 5a sum, well below 5b.
  assert.ok(out.vInf_km_s >= 112.42 && out.vInf_km_s < 112.42 * 1.005, `v∞ ${out.vInf_km_s}`);
  assert.ok(out.vInf_km_s < 161.58);
  assert.equal(doc.targetAsymptotic_km_s, 112.42);
});

test('concept B baseline matches §3.3 with a modelled solar sail', () => {
  const doc = scenarios['concept-b-baseline'];
  const out = applyTrajectory(doc);
  const o = oberth(out);
  close(o.burnRadius_AU / RSUN_AU, 10.0, 1e-9, 'r_p (R_sun)');
  close(o.vEsc_km_s, 195.33, 0.01, 'v_esc');
  close(o.vBefore_km_s, 194.46, 0.01, 'v_p-');
  const vpPlus = o.vBefore_km_s + doc.events[0].deltaV_km_s;
  close(vpPlus, 200.46, 0.01, 'v_p+');
  // Burn-only escape: sqrt(200.46² − 195.33²). (§6 lists 48.20, inconsistent with §3.3's own inputs.)
  close(out.log[0].after.vInf_km_s, 45.07, 0.01, 'burn-only v∞');
  // Hybrid equation 1.4 with β = 0.25 on the engine's perihelion state gives the doc result.
  const beta = 0.25;
  close(Math.sqrt(vpPlus ** 2 - (1 - beta) * o.vEsc_km_s ** 2), 107.56, 0.01, 'hybrid v∞');
  close(out.vInf_km_s, 107.56, 0.01, 'engine hybrid v∞');
  close(out.log[1].sail.beta, beta, 0, 'sail lightness number');
  close(out.totalDeltaV_km_s, 6, 1e-9, 'only the kick is impulsive');
  close(Math.sqrt(beta) * o.vEsc_km_s, 97.66, 0.01, 'pure-sail v∞');
  assert.equal(doc.targetAsymptotic_km_s, 107.56);
});

test('concept G deploys at 3 solar radii with the bound-arrival energy accounted for', () => {
  const doc = scenarios['concept-g'];
  const out = applyTrajectory(doc);
  const q = 3 * 695700;
  const mu = 1.32712440018e11;
  const a = (5.204 * AU_KM + q) / 2;
  assert.equal(doc.events.length, 1);
  assert.equal(doc.events[0].type, 'solarSail');
  assert.equal(doc.events[0].location, 'perihelion');
  close(out.log[0].after.r_AU, q / AU_KM, 1e-12, 'deployment radius');
  close(doc.events[0].beta, (300 ** 2 + mu / a) / (2 * mu / q), 1e-12, 'required beta');
  assert.equal(out.log[0].before.vInf_km_s, null);
  assert.ok(doc.initialElements.e < 1 && doc.initialElements.a > 0);
  close(out.vInf_km_s, 300, 1e-6, 'solar v∞ including remaining sail work');
  close(out.totalDeltaV_km_s, 0, 0, 'no impulsive delta-v');
  close(out.log[0].sail.remainingWork_km2_s2 - mu / (2 * a), 45000, 1e-8, 'energy gain');
  // A jettison keeps delivered work only: the 300 km/s target needs the tail.
  const finite = applyTrajectory({ ...doc, events: [...doc.events,
    { type: 'solarSail', beta: 0, location: 60 }] });
  assert.ok(finite.vInf_km_s > 0 && finite.vInf_km_s < out.vInf_km_s);
});

test('concept C baseline matches §4.3', () => {
  const doc = scenarios['concept-c-baseline'];
  const out = applyTrajectory(doc);
  const o = oberth(out);
  close(o.burnRadius_AU / RSUN_AU, 3.5, 1e-9, 'r_p (R_sun)');
  // Initial inbound hyperbola has v∞,in = 45 km/s and starts at 1 AU.
  close(out.log[0].before.vInf_km_s, 45.0, 1e-9, 'v∞,in');
  close(out.log[0].before.r_AU, 1.0, 1e-6, 'start radius');
  close(o.vEsc_km_s, 330.16, 0.01, 'v_esc');
  close(o.vBefore_km_s, 333.21, 0.01, 'v_p-');
  close(o.analyticVInf_km_s, 136.36, 0.01, 'v∞,SOM');
  const tethers = doc.events.filter((e) => e.type === 'tetherRelease');
  assert.equal(tethers.length, 15);
  close(tethers.reduce((s, e) => s + e.deltaV_km_s, 0), 60.0, 1e-12, 'Σ tether Δv');
  assert.ok(!doc.events.some((e) => e.type === 'hitchhike'), 'baseline has no hitchhike');
  assert.ok(out.vInf_km_s >= 196.36 && out.vInf_km_s < 196.36 * 1.005, `v∞ ${out.vInf_km_s}`);
  assert.ok(out.vInf_km_s < 255.07);
  assert.equal(doc.targetAsymptotic_km_s, 196.36);
});

test('tether stations sit on the outbound leg between 10 and 30 AU', () => {
  for (const id of ['concept-a-baseline', 'concept-c-baseline']) {
    const out = applyTrajectory(scenarios[id]);
    for (const e of out.log.filter((x) => x.type === 'tetherRelease')) {
      const r = e.after.r_AU;
      assert.ok(r > 9.99 && r < 30.01, `${id} ${e.id} at ${r} AU`);
    }
  }
});

for (const [id, epoch, target, encounters] of [
  ['voyager-1', '1977-09-05T12:56:01Z', 16.9, [['Jupiter', '1979-03-05'], ['Saturn', '1980-11-12']]],
  ['voyager-2', '1977-08-20T14:29:44Z', 15.2, [['Jupiter', '1979-07-09'], ['Saturn', '1981-08-25'], ['Uranus', '1986-01-24'], ['Neptune', '1989-08-25']]]
]) {
  test(`${id} preserves the historical launch/encounters and calibrated escape speed`, () => {
    const doc = scenarios[id];
    assert.equal(doc.epoch, epoch);
    assert.deepEqual(doc.events.map(e => [e.type, e.body, e.id]),
      encounters.map(([body, date]) => ['gravityAssist', body, `${body.toLowerCase()}-${date}`]));
    const out = applyTrajectory(doc);
    close(out.vInf_km_s, target, 0.3, 'final heliocentric v∞');
    assert.equal(doc.targetAsymptotic_km_s, target);
    assert.equal(out.totalDeltaV_km_s, 0, 'unpowered gravity assists only');
    for (const entry of out.log) {
      close(entry.flyby.vInfOut_km_s, entry.flyby.vInfIn_km_s, 1e-9, 'planet-frame flyby energy conservation');
      assert.ok(entry.flyby.periapsisAltitude_km > 0, 'flyby clears the planet surface');
    }
  });
}

test('index order matches descending engine-computed final v∞', () => {
  const speeds = index.map(entry => applyTrajectory(scenarios[entry.id]).vInf_km_s);
  assert.ok(speeds.every(speed => Number.isFinite(speed) && speed > 0));
  assert.deepEqual(speeds, [...speeds].sort((a, b) => b - a));
});

test('picker lists only index entries and defaults to the fastest final v∞', () => {
  const options = pickerOptions(index);
  assert.deepEqual(options.map(o => o.value), index.map(e => `scenarios/${e.file}`));
  assert.deepEqual(options.map(o => o.label), index.map(e => e.category === 'exotic' ? `Exotic · speculative — ${e.name}` : e.name));
  assert.ok(!options.some(o => o.value === 'schema-example.json'));
  const fastest = [...index].sort((a, b) => applyTrajectory(scenarios[b.id]).vInf_km_s - applyTrajectory(scenarios[a.id]).vInf_km_s)[0];
  for (const search of ['', '?scenario=', '?other=1']) {
    assert.equal(selectScenario(options, search), `scenarios/${fastest.file}`);
  }
  for (const entry of index) {
    assert.equal(selectScenario(options, `?scenario=scenarios/${entry.file}`), `scenarios/${entry.file}`);
  }
  assert.equal(selectScenario(options, '?scenario=custom.json'), 'custom.json');
  assert.equal(selectScenario(options, '?scenario=schema-example.json'), 'schema-example.json');
  assert.equal(selectScenario([], '?scenario=custom.json'), 'custom.json');
  assert.throws(() => selectScenario([], ''), /No reference scenarios/);
  assert.throws(() => pickerOptions({}), /must be an array/);
});

test('exotic picker entries clearly label speculation and expose feasibility and showstoppers', () => {
  for (const id of ['concept-d', 'concept-e', 'concept-f', 'concept-g']) {
    const entry = index.find(entry => entry.id === id);
    assert.equal(entry.category, 'exotic');
    const option = pickerOptions(index).find(option => option.id === entry.id);
    assert.match(option.label, /Exotic · speculative/);
    assert.match(option.feasibility, /TRL 2/);
    assert.equal(option.showstopper, entry.showstopper);
    assert.ok(option.title.includes(`Showstopper: ${entry.showstopper}`));
    assert.ok(option.title.includes(`Feasibility: ${entry.feasibility}`));
  }
});
