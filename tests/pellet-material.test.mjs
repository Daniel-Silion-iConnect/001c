// Independent numerical checks of the issue #60 analysis, exercised by npm test.
import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';

const reference = JSON.parse(execFileSync('python3', ['-c', `
import contextlib, io, json, runpy, sys
with contextlib.redirect_stdout(io.StringIO()):
    calc = runpy.run_path(sys.argv[1])
compare = calc['pellet_material_comparison']
invalid = []
for key in ('mass_kg', 'relative_velocity_km_s', 'field_T', 'cloud_radius_m',
            'temperature_eV', 'coulomb_log'):
    for value in (0, -1, float('nan'), float('inf')):
        try:
            compare(**{key: value})
        except ValueError:
            invalid.append([key, str(value)])
print(json.dumps({'materials': compare(), 'doubleMass': compare(mass_kg=0.000750),
    'dilute': compare(cloud_radius_m=100), 'doubleField': compare(field_T=0.02),
    'hotter': compare(temperature_eV=40),
    'launch': calc['pellet_launch_and_environment'](), 'invalid': invalid}))
`, new URL('../analysis/ideas_calc.py', import.meta.url).pathname], { encoding: 'utf8' }));
const near = (a, b, tolerance, label) =>
  assert.ok(Math.abs(a - b) <= tolerance, `${label}: ${a} vs ${b}`);
const rows = reference.materials;

test('material table reproduces independently checked sphere sizes and atomic energy floors', () => {
  // m=0.375 g; N=m*N_A/A; NIST successive atomic thresholds, rounded for the doc.
  // This catches eV/J, g/kg, radius/diameter, and last-IE/summed-IE mistakes.
  const expected = [
    ['lithium', 11.028, 28.110, 1.0609],
    ['aluminium', 6.426, 8.027, 8.8572],
    ['polyethylene CH2', 9.301, 99.201, 2.7274],
    ['deuterated polyethylene CD2', 8.895, 86.755, 2.3852],
    ['coated iron', 4.637, 5.265, 21.7512],
    ['frozen hydrogen H2', 20.223, 488.143, 0.4881],
    ['frozen neon', 7.916, 38.665, 6.2964],
  ];
  assert.equal(Object.keys(rows).length, expected.length);
  for (const [name, diameter, single_kJ, full_MJ] of expected) {
    const row = rows[name];
    near(row.diameter_mm, diameter, 0.0005, `${name} diameter`);
    near(row.singleIonisation_J / 1e3, single_kJ, 0.0005, `${name} single`);
    near(row.fullIonisation_J / 1e6, full_MJ, 0.00005, `${name} full`);
    near(row.density_g_cm3 * Math.PI / 6 * (row.diameter_mm / 10) ** 3,
      0.375, 1e-12, `${name} reconstructed mass in grams`);
  }
  // One electron per H atom fully strips it; one per Al atom does not.
  assert.equal(rows['frozen hydrogen H2'].singleIonisation_J, rows['frozen hydrogen H2'].fullIonisation_J);
  const al = rows.aluminium.components.Al;
  near(al.atomCount, 8.37e21, 1e19, 'Al atom count');
  near(al.fullIonisation_eV, 6604.952, 0.001, 'sum of all 13 Al thresholds');
  assert.equal(Math.round(al.massToChargeSingle_u_e / al.massToChargeFull_u_e), 13);
});

test('polymer atom counts and coating geometry conserve the specified pellet composition', () => {
  const ch = rows['polyethylene CH2'];
  const cd = rows['deuterated polyethylene CD2'];
  near(ch.components.H.atomCount / ch.components.C.atomCount, 2, 1e-12, 'CH2 stoichiometry');
  near(cd.components.D.atomCount / cd.components.C.atomCount, 2, 1e-12, 'CD2 stoichiometry');
  // Same assumed repeat volume gives the same density per carbon count at fixed mass.
  near(ch.components.C.atomCount * ch.density_g_cm3,
    cd.components.C.atomCount * cd.density_g_cm3, 1e7, 'isotope volume assumption');
  const iron = rows['coated iron'];
  near(iron.density_g_cm3, 7.18517, 0.000005, 'coated Fe density');
  near(iron.coatingThickness_um, 107.80, 0.005, 'shell thickness includes its mass');
  const coreDiameter_cm = (iron.diameter_mm - 2 * iron.coatingThickness_um / 1000) / 10;
  near(7.874 * Math.PI / 6 * coreDiameter_cm ** 3, 0.375 * 0.95, 1e-12, 'Fe core mass');
});

test('mass, field and dilution scalings preserve extensive energy and plasma geometry', () => {
  for (const [name, row] of Object.entries(rows)) {
    near(reference.doubleMass[name].singleIonisation_J / row.singleIonisation_J, 2, 1e-12, 'energy linear in mass');
    near(reference.doubleMass[name].diameter_mm / row.diameter_mm, Math.cbrt(2), 1e-12, 'sphere cube-root mass');
    for (const [symbol, ion] of Object.entries(row.components)) {
      const dilute = reference.dilute[name].components[symbol];
      near(dilute.ionDensity_cm3 / ion.ionDensity_cm3, 0.001, 1e-15, 'density inverse cloud volume');
      near(dilute.thermalMeanFreePath_m / ion.thermalMeanFreePath_m, 1000, 1e-9, 'path inverse density');
      near(reference.doubleField[name].components[symbol].gyroradiusSingle_m / ion.gyroradiusSingle_m,
        0.5, 1e-12, 'orbit radius inverse field');
      const hot = reference.hotter[name].components[symbol];
      near(hot.selfCollisionRate_s1 / ion.selfCollisionRate_s1, 1 / 8, 1e-12, 'thermal collision rate T^-3/2');
      near(hot.thermalMeanFreePath_m / ion.thermalMeanFreePath_m, 16, 1e-12, 'thermal path T^2');
    }
  }
});

test('Al reflector example exposes collisional and field-pressure limits', () => {
  const al = rows.aluminium.components.Al;
  near(al.gyroradiusSingle_m, 2.796, 0.0005, 'Al+ radius at 100 km/s in 10 mT');
  near(al.gyroradiusFull_m, 0.215, 0.0005, 'bare Al radius');
  near(al.ionDensity_cm3, 1.998e12, 0.001e12, '10 m cloud ion density');
  near(al.selfCollisionRate_s1, 5860, 1, 'NRL rate with mu=ion/proton mass');
  near(al.thermalMeanFreePath_m, 1.443, 0.0005, 'thermal path');
  assert.ok(al.thermalMeanFreePath_m < 10);
  assert.ok(reference.dilute.aluminium.components.Al.thermalMeanFreePath_m > 100);
  assert.ok(reference.launch.tenMetreCloudRamPressure_Pa > reference.launch.tenMilliTeslaPressure_Pa);
  near(reference.launch.tenMetreCloudCrossing_s, 0.0002, 1e-15, 'pulse crossing time');
});

test('chirp momentum and photon input remain distinct from pellet kinetic energy', () => {
  const env = reference.launch;
  near(env.totalPelletMass_kg, 3.75, 1e-12, 'stream mass');
  near(env.impulsePerPellet_N_s, 60, 1e-12, '80% reflected momentum');
  near(env.deltaV_km_s, 300, 1e-12, 'probe delta-v');
  assert.deepEqual(env.launchSpeedRange_km_s, [100, 400]);
  near(env.launchEnergy_J / 1e9, 131.25, 0.000001, 'midpoint KE sum');
  near(env.singlePassPhotonEnergy_J / 1e12, 140.53125, 1e-10, 'single-pass light energy');
  assert.ok(env.singlePassPhotonEnergy_J > 1000 * env.launchEnergy_J);
  assert.deepEqual(env.launchKEEndpoint_J, [1.875e6, 30e6]);
  near(env.relativeKEPerPellet_J, 1.875e6, 1e-9, 'neutral impact energy');
  near(env.coilgunLengthEndpoints_km[0], 50.99, 0.005, 'track at 100 km/s');
  near(env.coilgunLengthEndpoints_km[1], 815.77, 0.005, 'track at 400 km/s');
  near(env.greySphereTemperature_K['1'], 278.3, 0.05, 'grey sphere 1 AU');
  near(env.greySphereTemperature_K['5'], 124.5, 0.05, 'grey sphere 5 AU');
  near(env.illustrativeSailTemperature_K, 648, 0.5, 'two-face launch sail balance');
  assert.ok(env.greySphereTemperature_K['5'] > env.phaseTemperatures_K.Ne_triple);
});

test('undefined zero, negative and nonfinite material scales fail explicitly', () => {
  assert.equal(reference.invalid.length, 6 * 4);
});
