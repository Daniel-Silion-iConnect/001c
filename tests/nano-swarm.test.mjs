import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { applyTrajectory } from '../prototype/spacekit/engine.js';

test('nano-swarm conservation, thermal/mass scaling, attrition, arrival and link budgets', () => {
  execFileSync('python3', ['-c', `
import contextlib, io, runpy, sys, unittest
with contextlib.redirect_stdout(io.StringIO()):
    calc = runpy.run_path(sys.argv[1])
result = unittest.TextTestRunner(verbosity=2).run(
    unittest.defaultTestLoader.loadTestsFromTestCase(calc['NanoSwarmTests']))
sys.exit(0 if result.wasSuccessful() else 1)
`, new URL('../analysis/ideas_calc.py', import.meta.url).pathname], { stdio: 'pipe' });
});

test('Concept H represents an independent scaled G chip with no fictional capture impulse', () => {
  const read = name => JSON.parse(readFileSync(new URL(`../prototype/spacekit/${name}`, import.meta.url)));
  const h = read('scenarios/scenario-h.json');
  const g = read('scenarios/scenario-g.json');
  assert.deepEqual(h.initialElements, g.initialElements);
  assert.equal(h.events.length, 1);
  assert.equal(h.events[0].type, 'solarSail');
  assert.equal(h.events[0].location, 'perihelion');
  assert.equal(h.events[0].beta, g.events[0].beta);
  const result = applyTrajectory(h);
  assert.ok(Math.abs(result.vInf_km_s - 300) < 1e-6);
  assert.equal(result.totalDeltaV_km_s, 0);
  const entry = read('scenarios/index.json').find(e => e.id === 'concept-h');
  assert.equal(entry.category, 'exotic');
  assert.match(entry.feasibility, /TRL 2/);
  assert.match(entry.showstopper, /braking/);
  assert.match(h.description, /representative chip/);
  assert.match(h.description, /not modeled/);
  assert.match(read('narratives.json').scenarios['concept-h'], /does not make the chips faster/);
});
