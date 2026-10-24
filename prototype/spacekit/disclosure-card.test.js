import test from 'node:test';
import assert from 'node:assert/strict';
import { createDisclosureCard } from './disclosure-card.js';

// Exercise the factory shared by story and analysis panels without a browser dependency.
function browser(t, initialWidth) {
  let width = initialWidth;
  const originalDocument = Object.getOwnPropertyDescriptor(globalThis, 'document');
  const originalWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');
  globalThis.document = {
    createElement(tagName) {
      return { tagName, children: [], append(...children) { this.children.push(...children); } };
    }
  };
  globalThis.window = {
    matchMedia(query) {
      const minimum = /^\(min-width: (\d+)px\)$/.exec(query);
      assert.ok(minimum, `Expected a minimum viewport width query, got ${query}`);
      return { matches: width >= Number(minimum[1]) };
    }
  };
  t.after(() => {
    for (const [key, descriptor] of [['document', originalDocument], ['window', originalWindow]]) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else delete globalThis[key];
    }
  });
  return value => { width = value; };
}

for (const width of [460, 899, 900, 901, 1400]) {
  test(`story and analysis cards default ${width >= 900 ? 'open' : 'closed'} at ${width}px`, t => {
    browser(t, width);
    for (const [title, id] of [['Full scenario story', 'full-story-card'], ['Speed after each step · v∞ (km/s)', 'speed-card'], ['All travel times', 'travel-card']]) {
      const card = createDisclosureCard(title, id);
      assert.equal(card.element.tagName, 'details');
      assert.equal(card.element.id, id);
      assert.equal(card.element.open, width >= 900);
      assert.equal(card.element.children[0].tagName, 'summary');
      assert.equal(card.element.children[0].textContent, title);
      assert.equal(card.element.children[1], card.content);
    }
  });
}

test('defaults apply only on creation; resizing and new cards preserve user toggles', t => {
  const resize = browser(t, 1400);
  const speed = createDisclosureCard('Speed', 'speed-card').element;
  speed.open = false;
  resize(460);
  const travel = createDisclosureCard('Travel', 'travel-card').element;
  assert.equal(travel.open, false);
  travel.open = true;
  resize(1400);
  assert.equal(createDisclosureCard('New card', 'new-card').element.open, true);
  assert.equal(speed.open, false);
  assert.equal(travel.open, true);
});
