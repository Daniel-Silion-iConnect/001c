import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createNarrativePanel, loadNarratives, narrativeText } from './narrative-panel.js';
import { pickerOptions, scenarioIdForPath } from './scenario-picker.js';

const read = path => JSON.parse(readFileSync(new URL(path, import.meta.url)));
const narratives = read('./narratives.json');
const index = read('./scenarios/index.json');
const options = pickerOptions(index);
const base = 'https://example.test/viewer/';

// Minimal DOM for checking panel content and state; browser checks cover layout.
function browser(t, width) {
  const originals = ['document', 'window'].map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]);
  globalThis.document = {
    createElement(tagName) {
      return {
        tagName, children: [],
        setAttribute() {},
        append(...children) { this.children.push(...children); },
        set innerHTML(value) {
          this.children = [...value.matchAll(/class="([^"]+)"/g)].map(([, className]) => ({ className, textContent: '' }));
        },
        querySelector(selector) {
          return this.children.find(node => node.className?.split(' ').includes(selector.slice(1))) ?? null;
        }
      };
    }
  };
  globalThis.window = { matchMedia: () => ({ matches: width >= 900 }) };
  t.after(() => {
    for (const [key, descriptor] of originals) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else delete globalThis[key];
    }
  });
}

for (const width of [460, 1400]) {
  test(`every scenario has a separate full-story card at ${width}px; updates preserve its toggle`, t => {
    browser(t, width);
    for (const reference of index) {
      const doc = read(`./scenarios/${reference.file}`);
      const panel = createNarrativePanel(doc, reference.id, reference.summary);
      const card = panel.storyElement;
      assert.equal(card.tagName, 'details');
      assert.equal(card.id, 'full-story-card');
      assert.equal(card.open, width >= 900);
      assert.equal(card.children[0].textContent, 'Full scenario story');
      assert.notEqual(card, panel.element);
      assert.equal(panel.element.querySelector('.narrative-scenario'), null);
      const content = card.children[1];
      const scenario = content.querySelector('.narrative-scenario');
      assert.equal(scenario.textContent, doc.description);
      card.open = !card.open;
      panel.select(1, 'skipped');
      panel.setData(narratives);
      assert.equal(card.open, width < 900, 'late data and leg changes preserve user choice');
      assert.equal(scenario.textContent, narratives.scenarios[reference.id]);
      assert.equal(content.querySelector('.narrative-intro').textContent, narratives.intro);
      assert.equal(panel.element.querySelector('.narrative-short').textContent, reference.summary);
      assert.match(panel.element.querySelector('.narrative-event').textContent, doc.events.length ? /skipped by the engine/ : /does not simulate/);
      panel.select(0);
      assert.match(panel.element.querySelector('.narrative-event').textContent, doc.events.length ? /before any modeled events/ : /departure coast/);
      assert.equal(scenario.textContent, narratives.scenarios[reference.id]);
    }
  });
}

for (const reference of index) {
  test(`${reference.id}: picker path resolves its narrative and each event type`, () => {
    const doc = read(`./scenarios/${reference.file}`);
    for (const path of [`scenarios/${reference.file}`, `./scenarios/${reference.file}`, `${base}scenarios/${reference.file}`]) {
      const id = scenarioIdForPath(options, path, base);
      assert.equal(id, reference.id);
      const initial = narrativeText(narratives, id, doc, 0);
      assert.equal(initial.intro, narratives.intro);
      assert.equal(initial.scenario, narratives.scenarios[id]);
      assert.equal(initial.eventTitle, doc.events.length ? 'Leg 0 · Initial orbit' : 'Leg 0 · Departure coast');
      assert.match(initial.event, doc.events.length ? /before any modeled events/ : /does not simulate launch acceleration.*destination braking/);
      doc.events.forEach((event, i) => {
        const copy = narrativeText(narratives, id, doc, i + 1);
        assert.ok(copy.event.startsWith(narratives.eventTypes[event.type]));
        assert.equal(copy.eventTitle, `Leg ${i + 1} · ${event.id || event.type}`);
        assert.equal(copy.scenario, initial.scenario);
      });
    }
  });
}

test('Concept I narratives distinguish Starshot flyby from the ultralight capture architecture', () => {
  for (const id of ['concept-i-flyby', 'concept-i-capture']) {
    const story = narratives.scenarios[id];
    for (const required of [/100 GW/, /gram chip/, /sail/, /not a 1 kg probe/, /brak/, /30 AU/]) assert.match(story, required);
  }
  assert.match(narratives.scenarios['concept-i-flyby'], /21.2 years/);
  assert.match(narratives.scenarios['concept-i-flyby'], /no gram-scale onboard system.*stop/i);
  assert.match(narratives.scenarios['concept-i-capture'], /Heller & Hippke \(2017\)/);
  assert.match(narratives.scenarios['concept-i-capture'], /95-year A\/B arrival scale/);
  assert.match(narratives.scenarios['concept-i-capture'], /100,000 m².*10 g payload/);
});

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
