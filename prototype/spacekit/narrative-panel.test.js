import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { loadNarratives, narrativeText } from './narrative-panel.js';
import { pickerOptions, scenarioIdForPath } from './scenario-picker.js';

const read = path => JSON.parse(readFileSync(new URL(path, import.meta.url)));
const narratives = read('./narratives.json');
const index = read('./scenarios/index.json');
const options = pickerOptions(index);
const base = 'https://example.test/viewer/';

for (const reference of index) {
  test(`${reference.id}: picker path resolves its narrative and each event type`, () => {
    const doc = read(`./scenarios/${reference.file}`);
    for (const path of [`scenarios/${reference.file}`, `./scenarios/${reference.file}`, `${base}scenarios/${reference.file}`]) {
      const id = scenarioIdForPath(options, path, base);
      assert.equal(id, reference.id);
      const initial = narrativeText(narratives, id, doc, 0);
      assert.equal(initial.intro, narratives.intro);
      assert.equal(initial.scenario, narratives.scenarios[id]);
      assert.equal(initial.eventTitle, 'Leg 0 · Initial orbit');
      assert.match(initial.event, /before any modeled events/);
      doc.events.forEach((event, i) => {
        const copy = narrativeText(narratives, id, doc, i + 1);
        assert.ok(copy.event.startsWith(narratives.eventTypes[event.type]));
        assert.equal(copy.eventTitle, `Leg ${i + 1} · ${event.id || event.type}`);
        assert.equal(copy.scenario, initial.scenario);
      });
    }
  });
}

test('custom paths do not borrow a reference narrative, including on other origins', () => {
  for (const path of ['custom.json', 'schema-example.json', 'https://other.test/viewer/scenarios/scenario-a.json']) {
    assert.equal(scenarioIdForPath(options, path, base), undefined);
  }
  const copy = narrativeText(narratives, undefined, { description: 'A custom mission.', events: [] }, 0);
  assert.equal(copy.scenario, 'A custom mission.');
});

test('STP context supplements only the named solar-thermal Oberth event', () => {
  const doc = read('./scenarios/scenario-c.json');
  const copy = narrativeText(narratives, 'concept-c-baseline', doc, 1);
  assert.equal(copy.event, `${narratives.eventTypes.oberthBurn}\n\n${narratives.eventTypes.stp}`);
  doc.events[0].id = 'chemical-oberth';
  assert.equal(narrativeText(narratives, 'concept-c-baseline', doc, 1).event, narratives.eventTypes.oberthBurn);
});

test('skipped events explain intent and switching back to leg 0 clears event text', () => {
  const doc = { events: [{ type: 'burn' }] };
  const skipped = narrativeText(narratives, undefined, doc, 1, 'skipped');
  assert.match(skipped.event, /skipped by the engine/);
  assert.ok(skipped.event.endsWith(narratives.eventTypes.burn));
  assert.equal(narrativeText(narratives, undefined, doc, 1, 'applied').event, narratives.eventTypes.burn);
  assert.match(narrativeText(narratives, undefined, doc, 0).event, /before any modeled events/);
});

test('missing, empty, or malformed keys keep readable fallback text', () => {
  const doc = { events: [{ type: 'hitchhike' }] };
  for (const data of [undefined, null, {}, { intro: 42, scenarios: [], eventTypes: null },
    { intro: ' ', scenarios: { custom: {} }, eventTypes: { hitchhike: '' } }]) {
    const copy = narrativeText(data, 'custom', doc, 1);
    assert.match(copy.intro, /Project 001c/);
    assert.match(copy.scenario, /No narrative is available/);
    assert.match(copy.event, /No explanation is available/);
    assert.ok(!Object.values(copy).some(value => /undefined|\[object Object\]/.test(value)));
  }
  assert.equal(narrativeText({ eventTypes: { burn: 'Burn text.' } }, undefined, { events: [{ type: 'burn' }] }, 1).event, 'Burn text.');
  assert.match(narrativeText(narratives, 'toString', { events: [{ type: 'constructor' }] }, 1).event, /No explanation/);
});

test('narrative loading handles HTTP, network, JSON, and top-level data failures', async () => {
  for (const fetchJSON of [
    async () => ({ ok: false }),
    async () => { throw new Error('offline'); },
    async () => ({ ok: true, json: async () => { throw new SyntaxError('invalid JSON'); } }),
    ...[null, [], 'unexpected'].map(value => async () => ({ ok: true, json: async () => value }))
  ]) assert.deepEqual(await loadNarratives(fetchJSON), {});
  assert.equal(await loadNarratives(async (path, { signal }) => {
    assert.equal(path, 'narratives.json');
    assert.ok(signal instanceof AbortSignal);
    return { ok: true, json: async () => narratives };
  }), narratives);
});
