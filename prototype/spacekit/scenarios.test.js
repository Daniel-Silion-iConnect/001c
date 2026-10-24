// Reference scenarios A/B/C (docs/analyses/reference-scenarios.md): schema validity,
// engine run, and agreement with the doc's back-of-envelope numbers.
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { test } from 'node:test';
import { validateTrajectory } from '../../scripts/validate-schema.mjs';
import { applyTrajectory, AU_KM } from './engine.js';
import { buildTrajectory } from './viewer-data.js';
import { DEFAULT_SCENARIO, pickerOptions } from './scenario-picker.js';

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
    assert.deepEqual(Object.keys(entry).sort(), ['file', 'id', 'name', 'summary']);
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

test('picker lists the schema example first, then index entries', () => {
  const options = pickerOptions(index);
  assert.equal(options[0].value, DEFAULT_SCENARIO);
  assert.deepEqual(options.slice(1).map((o) => o.value), index.map((e) => `scenarios/${e.file}`));
  assert.deepEqual(options.slice(1).map((o) => o.label), index.map((e) => e.name));
  assert.throws(() => pickerOptions({}), /must be an array/);
});
