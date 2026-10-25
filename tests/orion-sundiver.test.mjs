// Keep the independently checked energy, mass and thermal budgets on CI's path.
import test from 'node:test';
import { execFileSync } from 'node:child_process';

test('Orion and sundiver approach energy, sail work, optics, mass and heat', () => {
  execFileSync('python3', ['-c', `
import contextlib, io, runpy, sys, unittest
with contextlib.redirect_stdout(io.StringIO()):
    calc = runpy.run_path(sys.argv[1])
suite = unittest.defaultTestLoader.loadTestsFromTestCase(calc['OrionSundiverTests'])
result = unittest.TextTestRunner(verbosity=2).run(suite)
sys.exit(0 if result.wasSuccessful() else 1)
`, new URL('../analysis/ideas_calc.py', import.meta.url).pathname], { stdio: 'pipe' });
});
