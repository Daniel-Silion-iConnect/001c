// Keep the sourced sungrazer calculations on the required npm/CI test path.
import test from 'node:test';
import { execFileSync } from 'node:child_process';

test('comet orbit, Oberth energy, heat, exposure, shade and rendezvous physics', () => {
  execFileSync('python3', ['-c', `
import contextlib, io, runpy, sys, unittest
with contextlib.redirect_stdout(io.StringIO()):
    calc = runpy.run_path(sys.argv[1])
suite = unittest.defaultTestLoader.loadTestsFromTestCase(calc['CometHitchhikeTests'])
result = unittest.TextTestRunner(verbosity=2).run(suite)
sys.exit(0 if result.wasSuccessful() else 1)
`, new URL('../analysis/ideas_calc.py', import.meta.url).pathname], { stdio: 'pipe' });
});
