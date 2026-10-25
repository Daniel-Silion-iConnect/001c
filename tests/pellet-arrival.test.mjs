// Independent unit/scale checks for Concept F's issue #65 arrival analysis.
import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';

const ref = JSON.parse(execFileSync('python3', ['-c', `
import contextlib, io, json, runpy, sys
with contextlib.redirect_stdout(io.StringIO()):
    calc = runpy.run_path(sys.argv[1])
arrival = calc['pellet_arrival_budget']
reflector = calc['pellet_reflector_budget']
invalid = []
for function, keys in ((arrival, ('boost_days', 'pulse_s',
        'electron_temperature_eV', 'ion_temperature_eV', 'cloud_radius_m')),
        (reflector, ('cloud_radius_m', 'coil_radius_m', 'current_density_A_m2'))):
    for key in keys:
        for value in (0, -1, float('nan'), float('inf')):
            try:
                function(**{key: value})
            except ValueError:
                invalid.append(key)
for kwargs, function in (({'pulse_s': 259.2}, arrival),
                         ({'current_density_A_m2': 1}, reflector)):
    try:
        function(**kwargs)
    except ValueError:
        invalid.append('invalid geometry or overlap')
print(json.dumps({'arrival': arrival(), 'reflector': reflector(),
    'slow': arrival(boost_days=60, pulse_s=20e-6),
    'hot': arrival(electron_temperature_eV=40, ion_temperature_eV=40),
    'dilute': reflector(cloud_radius_m=20),
    'denseConductor': reflector(current_density_A_m2=2e8), 'invalid': invalid}))
`, new URL('../analysis/ideas_calc.py', import.meta.url).pathname], { encoding: 'utf8' }));
const near = (value, expected, tolerance) =>
  assert.ok(Math.abs(value - expected) <= tolerance, `${value} vs ${expected}`);

test('arrival energy, cadence and pulse power keep kg/g and average/pulse units distinct', () => {
  const a = ref.arrival;
  near(a.shotInterval_s, 259.2, 1e-12);
  near(a.arrivalRate_s1 * a.duration_s, 10000, 1e-10);
  assert.equal(a.specificImpactEnergy_J_kg, 5e9);
  assert.equal(a.oneGramImpact_J, 5e6); // issue prose was a factor of 1000 too low
  assert.equal(a.pelletImpact_J, 1.875e6);
  near(a.oneGramTNTEquivalent_g, 1190.476, 0.001);
  near(a.atomisation_J, 4582.3, 0.1);
  const single = a.routes.single;
  const full = a.routes.full;
  near(single.atomicFloor_J, 8026.86, 0.01);
  near(full.atomicFloor_J, 8857180.8, 0.1);
  near(single.thermal_J, 40229.73, 0.01);
  // 13 electrons + one ion vs one electron + one ion, at equal T.
  near(full.thermal_J / single.thermal_J, 7, 1e-12);
  near(single.illustrativeDeposited_J, 52838.89, 0.01);
  near(single.depositedAverage_W, 203.854, 0.001);
  near(single.depositedPulse_W / 1e9, 5.28389, 0.00001);
  near(full.floorAverage_W, 34171.22, 0.01);
  near(full.floorPulse_W / 1e12, 0.885718, 0.000001);
  for (const [name, route] of Object.entries(a.routes)) {
    near(route.depositedPulse_W * a.dutyFactor, route.depositedAverage_W, 1e-10);
    near(ref.slow.routes[name].depositedAverage_W / route.depositedAverage_W, 0.5, 1e-12);
    near(ref.slow.routes[name].depositedPulse_W / route.depositedPulse_W, 0.5, 1e-12);
  }
});

test('expansion timing uses relative approach speed and an explicit thermal sound scale', () => {
  const a = ref.arrival;
  near(a.soundSpeed_m_s, 9765.212, 0.001);
  near(a.expansionTime_s * 1e3, 1.024043, 0.000001);
  near(a.pulseEndStandoff_m, 102.4043, 0.0001);
  near(a.soundSpeed_m_s * a.expansionTime_s, a.cloudDiameter_m / 2, 1e-12);
  near(a.pulseEndStandoff_m / a.expansionTime_s, 100e3, 1e-9);
  assert.equal(a.pulseTravel_m, 1);
  near(ref.hot.soundSpeed_m_s / a.soundSpeed_m_s, 2, 1e-12);
  near(ref.hot.pulseEndStandoff_m / a.pulseEndStandoff_m, 0.5, 1e-12);
});

test('ram pressure, reversal momentum and orbit scales expose the weak-field mismatch', () => {
  const r = ref.reflector;
  near(r.ramPressure_Pa, 895.2466, 0.0001);
  near(r.tenMilliTeslaPressure_Pa, 39.7887, 0.0001);
  near(r.pressureBalanceField_T * 1000, 47.43416, 0.00001);
  near(r.fullReversalFieldScale_T * 1000, 67.08204, 0.00001);
  near(r.gyroradiusAtBalance_m, 0.589541, 0.000001);
  near(r.gyroradiusAtBalance_m / r.fullStripGyroradiusAtBalance_m, 13, 1e-12);
  near(r.halfGyroTimeAtBalance_s, Math.PI * r.gyroradiusAtBalance_m / 100e3, 1e-15);
  assert.equal(r.absorptionImpulse_N_s, 37.5);
  assert.equal(r.idealReflectionImpulse_N_s, 75);
  near(r.referenceImpulse_N_s, 60, 1e-12);
  near(r.referencePulseForceScale_N, 300000, 1e-9);
  near(r.referenceMeanForce_N * ref.arrival.duration_s, 2 * 300e3, 1e-9);
  near(ref.dilute.ramPressure_Pa / r.ramPressure_Pa, 1 / 8, 1e-12);
  near(ref.dilute.pressureBalanceField_T / r.pressureBalanceField_T, 1 / Math.sqrt(8), 1e-12);
});

test('coil costs use local field, conductor cross-section and inductive stored energy', () => {
  const r = ref.reflector;
  const c = r.balanceCentre;
  near(r.tenMilliTeslaCentre.current_A, 159154.943, 0.001);
  near(c.current_A, 754938.181, 0.001);
  near(c.conductorMass_kg, 4250.101, 0.001);
  near(c.storedEnergy_J / 1e6, 19.3285, 0.00001);
  near(c.conductorMass_kg, 2 * Math.PI * 10 * Math.PI * c.wireRadius_m ** 2 * 8960, 1e-9);
  near(c.storedEnergy_J, 0.5 * c.inductance_H * c.current_A ** 2, 1e-7);
  const upstream = r.balanceOneRadiusUpstream;
  near(upstream.current_A / c.current_A, Math.sqrt(8), 1e-12);
  near(upstream.conductorMass_kg, 12021.101, 0.001);
  near(upstream.storedEnergy_J / 1e6, 139.7351, 0.0001);
  const dense = ref.denseConductor.balanceCentre;
  near(dense.current_A, c.current_A, 1e-9);
  near(dense.conductorMass_kg / c.conductorMass_kg, 0.5, 1e-12);
  assert.ok(dense.storedEnergy_J > c.storedEnergy_J, 'thinner wire increases external inductance');
});

test('undefined scales, overlapping shots and a non-thin coil fail explicitly', () => {
  assert.equal(ref.invalid.length, 8 * 4 + 2);
});
