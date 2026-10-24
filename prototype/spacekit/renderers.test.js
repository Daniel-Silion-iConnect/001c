import test from 'node:test';
import assert from 'node:assert/strict';
import { sceneLabels, REFERENCE_ORBITS } from './renderers.js';

// Test the annotation layer shared by Three.js and canvas without a WebGL dependency.
function annotationHost(t, width, height) {
  const originalDocument = Object.getOwnPropertyDescriptor(globalThis, 'document');
  const element = () => ({
    children: [], style: {}, hidden: false,
    get offsetWidth() { return this.textContent === 'Sun' ? 44 : 110; },
    offsetHeight: 24,
    setAttribute() {},
    append(...children) { this.children.push(...children); },
    remove() { this.removed = true; }
  });
  globalThis.document = { createElement: element };
  t.after(() => {
    if (originalDocument) Object.defineProperty(globalThis, 'document', originalDocument);
    else delete globalThis.document;
  });
  return { ...element(), clientWidth: width, clientHeight: height };
}

function assertBodyLeader(layer, origin) {
  const find = name => layer.children.find(node => node.className === name);
  const marker = find('body-marker'), leader = find('body-leader');
  const label = find('scene-label body-label');
  assert.ok(leader, 'Sun needs its own leader instead of borrowing the nearby orbit leader');
  assert.equal(label.textContent, 'Sun');
  for (const node of [marker, leader, label]) assert.equal(node.hidden, false);
  assert.equal(leader.style.left, `${origin[0]}px`);
  assert.equal(leader.style.top, `${origin[1]}px`);
  assert.equal(marker.style.left, leader.style.left);
  assert.equal(marker.style.top, leader.style.top);
  const x = parseFloat(label.style.left), y = parseFloat(label.style.top);
  const angle = Number(leader.style.transform.match(/rotate\((.*)rad\)/)[1]);
  const length = parseFloat(leader.style.width);
  assert.ok(length > 0);
  const end = [origin[0] + length * Math.cos(angle), origin[1] + length * Math.sin(angle)];
  const expected = [Math.max(x, Math.min(x + label.offsetWidth, origin[0])),
    Math.max(y, Math.min(y + label.offsetHeight, origin[1]))];
  end.forEach((value, i) => assert.ok(Math.abs(value - expected[i]) < 1e-9));
  const ringLeader = find('orbit-leader');
  assert.notDeepEqual([leader.style.left, leader.style.top], [ringLeader.style.left, ringLeader.style.top]);
}

for (const [width, height] of [[460, 405], [1400, 900]]) {
  test(`Sun leader stays on the origin disc through projection and label shifts at ${width}px`, t => {
    const host = annotationHost(t, width, height);
    const annotations = sceneLabels(host, 'Sun', REFERENCE_ORBITS);
    const layer = host.children[0];
    for (const origin of [[width / 2, height / 2], [width / 2 + 17, height - 55]]) {
      const projected = [];
      annotations.update(position => {
        projected.push(position);
        return [origin[0] + position[0] * 12, origin[1] - position[1] * 12];
      });
      assert.deepEqual(projected[0], [0, 0, 0]);
      assertBodyLeader(layer, origin);
      if (origin[1] === height - 55) {
        const label = layer.children.find(node => node.className === 'scene-label body-label');
        assert.notEqual(parseFloat(label.style.top), origin[1] - 34, 'Label moves clear of plot instructions');
      }
    }
    annotations.dispose();
    assert.equal(layer.removed, true);
  });
}

test('offscreen or behind-camera origin hides the Sun disc, label, and leader together', t => {
  const host = annotationHost(t, 460, 405);
  const annotations = sceneLabels(host, 'Sun', REFERENCE_ORBITS);
  const layer = host.children[0];
  const body = layer.children.filter(node => node.className.includes('body-'));
  assert.equal(body.length, 3);
  for (const origin of [[-1, 200], [461, 200], [230, -1], [230, 406], [230, 200, false]]) {
    annotations.update(position => position.every(n => n === 0) ? origin : [300, 240]);
    for (const node of body) assert.equal(node.hidden, true);
    for (const node of layer.children.filter(node => node.className.startsWith('orbit-'))) {
      assert.equal(node.hidden, false, 'Ring annotations retain independent visibility');
    }
  }
  annotations.update(([x, y]) => [230 + x * 12, 200 - y * 12]);
  assertBodyLeader(layer, [230, 200]);
});
