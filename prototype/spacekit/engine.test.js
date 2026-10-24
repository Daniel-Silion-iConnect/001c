// Unit tests for the patched-conic engine. Run with `npm test`.
// Reference numbers are hand-checked in the comments (μ☉ = 1.32712440018e11
// km³/s², 1 AU = 1.495978707e8 km, μ⊕ = 398600.4418 km³/s²).

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  AU_KM,
  C_KM_S,
  MU,
  applyEvents,
  applyTrajectory,
  circularSpeed,
  elementsToState,
  escapeSpeed,
  oberthVInf,
  stateToElements,
  vInfinity,
  visViva
} from './engine.js';

const near = (actual, expected, tol, msg) =>
  assert.ok(
    Math.abs(actual - expected) <= tol,
    `${msg ?? ''} expected ${expected} ± ${tol}, got ${actual}`
  );

const circular1AU = { type: 'keplerian', a: 1, e: 0, units: { a: 'AU', angles: 'deg' } };

test('vis-viva: circular speed at 1 AU ≈ 29.78 km/s', () => {
  // sqrt(1.32712440018e11 / 1.495978707e8) = sqrt(887.13) = 29.785
  near(visViva(MU.Sun, AU_KM, AU_KM), 29.7847, 1e-3);
  near(circularSpeed(MU.Sun, AU_KM), 29.7847, 1e-3);
});

test('vis-viva: elliptic and hyperbolic (a < 0)', () => {
  // Hohmann Earth→Mars ellipse, a = (1 + 1.524)/2 = 1.262 AU, at r = 1 AU:
  // v = 29.785 * sqrt(2 − 1/1.262) = 29.785 * 1.0989 = 32.73 km/s
  near(visViva(MU.Sun, AU_KM, 1.262 * AU_KM), 32.73, 0.01);
  // Hyperbola with a = −1 AU at r = 1 AU: v = 29.785 * sqrt(3) = 51.59 km/s
  near(visViva(MU.Sun, AU_KM, -AU_KM), 51.589, 1e-3);
  // Parabola (a = ∞) gives escape speed: 29.785 * sqrt(2) = 42.122 km/s
  near(visViva(MU.Sun, AU_KM, Infinity), 42.122, 1e-3);
  near(escapeSpeed(MU.Sun, AU_KM), 42.122, 1e-3);
  assert.throws(() => visViva(MU.Sun, 3 * AU_KM, AU_KM), RangeError);
});

test('vInfinity: null when bound, 0 when parabolic, sqrt(v² − v_esc²) otherwise', () => {
  assert.equal(vInfinity(MU.Sun, AU_KM, 30), null);
  assert.equal(vInfinity(MU.Sun, AU_KM, escapeSpeed(MU.Sun, AU_KM)), 0);
  // sqrt(51.589² − 42.122²) = sqrt(2661.4 − 1774.3) = 29.785
  near(vInfinity(MU.Sun, AU_KM, visViva(MU.Sun, AU_KM, -AU_KM)), 29.785, 1e-3);
});

test('elements ↔ state round trip (elliptic inclined, hyperbolic, parabolic)', () => {
  const cases = [
    { p: 1.2 * AU_KM * (1 - 0.3 ** 2), e: 0.3, i: 0.4, raan: 1.1, argp: 2.0, nu: -0.7 },
    { p: 0.5 * AU_KM * (2.5 ** 2 - 1), e: 2.5, i: 2.9, raan: 5.0, argp: 0.3, nu: 1.0 },
    { p: 0.2 * AU_KM, e: 1, i: 0.1, raan: 0.2, argp: 0.3, nu: 0.5 }
  ];
  for (const k of cases) {
    const { r, v } = elementsToState(k, MU.Sun);
    const back = stateToElements(r, v, MU.Sun);
    for (const key of ['e', 'i', 'raan', 'argp', 'nu']) {
      near(back[key], k[key], 1e-9, key);
    }
    near(back.p / k.p, 1, 1e-12, 'p');
  }
});

test('bound orbit after a small burn reports vInf = null and fractionOfC = null', () => {
  const out = applyEvents(circular1AU, [{ type: 'burn', deltaV_km_s: 3, direction: 'prograde' }]);
  assert.equal(out.bound, true);
  assert.equal(out.vInf_km_s, null);
  assert.equal(out.asymptoticSpeed_km_s, null);
  assert.equal(out.fractionOfC, null);
  near(out.totalDeltaV_km_s, 3, 1e-12);
});

test('prograde burn reshapes the orbit: Hohmann departure to Mars distance', () => {
  // Transfer ellipse 1 → 1.524 AU needs v_p = 32.73 km/s, i.e. Δv ≈ 2.95 km/s.
  const target = 1.524;
  const vp = visViva(MU.Sun, AU_KM, ((1 + target) / 2) * AU_KM);
  const dv = vp - circularSpeed(MU.Sun, AU_KM);
  near(dv, 2.95, 0.01);
  const out = applyEvents(circular1AU, [{ type: 'burn', deltaV_km_s: dv }]);
  const el = out.finalElements;
  near(el.a, (1 + target) / 2, 1e-9);
  near(el.e, (target - 1) / (target + 1), 1e-9);
  near(el.rp, 1, 1e-9);
  near(el.nu, 0, 1e-6, 'burn point becomes perihelion');
});

test('retrograde burn at aphelion lowers perihelion; normal burn tilts the plane', () => {
  const ellipse = { a: 1.262, e: 0.2076, units: { a: 'AU', angles: 'deg' } };
  const lowered = applyEvents(ellipse, [
    { type: 'burn', location: 'aphelion', deltaV_km_s: 2, direction: 'retrograde' }
  ]);
  assert.ok(lowered.finalElements.rp < 1, 'perihelion dropped');
  near(lowered.finalElements.rp + 0, lowered.finalElements.a * (1 - lowered.finalElements.e), 1e-9);

  // Pure normal Δv on a circular orbit: tan(Δi) = Δv / v_c.
  const tilted = applyEvents(circular1AU, [{ type: 'burn', deltaV_km_s: 1, direction: 'normal' }]);
  near(tilted.finalElements.i, Math.atan(1 / 29.7847) * (180 / Math.PI), 1e-3);
});

test('vector Δv [V, N, C] in VNC frame matches named direction', () => {
  const a = applyEvents(circular1AU, [{ type: 'burn', deltaV: [0.5, 0, 0], units: 'km/s' }]);
  const b = applyEvents(circular1AU, [{ type: 'burn', deltaV_km_s: 0.5, direction: 'prograde' }]);
  near(a.finalElements.a, b.finalElements.a, 1e-12);
  const c = applyEvents(circular1AU, [{ type: 'burn', deltaV: [500, 0, 0], units: 'm/s' }]);
  near(c.finalElements.a, b.finalElements.a, 1e-12);
});

test('Earth escape sanity: 200 km LEO', () => {
  // r = 6378.137 + 200 = 6578.137 km
  // v_c = sqrt(398600.4418 / 6578.137) = sqrt(60.595) = 7.784 km/s, v_esc = 11.009 km/s
  const r = 6578.137;
  const leo = { a: r, e: 0, units: { a: 'km', angles: 'deg' } };
  near(circularSpeed(MU.Earth, r), 7.784, 1e-3);
  near(escapeSpeed(MU.Earth, r), 11.009, 1e-3);

  // Δv = 3.0 km/s → v = 10.784 < 11.009: still bound.
  const short = applyEvents(leo, [{ type: 'burn', deltaV_km_s: 3 }], { centralBody: 'Earth' });
  assert.equal(short.bound, true);

  // Δv = 3.5 km/s → v = 11.284: v∞ = sqrt(11.284² − 2·60.595) = sqrt(127.335 − 121.190) ≈ 2.479
  const esc = applyEvents(leo, [{ type: 'burn', deltaV_km_s: 3.5 }], { centralBody: 'Earth' });
  assert.equal(esc.bound, false);
  near(esc.vInf_km_s, 2.479, 1e-3);
  assert.ok(esc.finalElements.a < 0 && esc.finalElements.e > 1, 'hyperbolic elements');
});

test('solar escape sanity from a 1 AU circular orbit', () => {
  // Exactly (√2 − 1)·v_c = 12.337 km/s reaches a parabola: v∞ = 0.
  const dvEsc = (Math.SQRT2 - 1) * circularSpeed(MU.Sun, AU_KM);
  near(dvEsc, 12.337, 1e-3);
  const par = applyEvents(circular1AU, [{ type: 'burn', deltaV_km_s: dvEsc }]);
  assert.equal(par.bound, false);
  assert.equal(par.vInf_km_s, 0);
  assert.equal(par.finalElements.a, null, 'parabola has a = ∞ → null');
  near(par.finalElements.e, 1, 1e-9);

  // 15 km/s: v = 44.785, v∞ = sqrt(44.785² − 42.122²) = sqrt(2005.7 − 1774.3) ≈ 15.21
  const hyp = applyEvents(circular1AU, [{ type: 'burn', deltaV_km_s: 15 }]);
  near(hyp.vInf_km_s, 15.21, 0.01);
  near(hyp.fractionOfC, hyp.vInf_km_s / C_KM_S, 1e-15);
});

test('Oberth: parabolic fall to 0.1 AU, then 5 km/s prograde at perihelion', () => {
  // v_esc(0.1 AU) = 42.122 * sqrt(10) = 133.20 km/s; parabolic v_p = v_esc.
  // v∞ = sqrt((133.20 + 5)² − 133.20²) = sqrt(2·133.20·5 + 25) = sqrt(1357.0) ≈ 36.84 km/s
  const fall = { type: 'keplerian', e: 1, rp: 0.1, nu: -90, units: { a: 'AU', angles: 'deg' } };
  const out = applyEvents(fall, [
    { id: 'dive', type: 'oberthBurn', perihelion_AU: 0.1, deltaV_km_s: 5 }
  ]);
  const vesc = escapeSpeed(MU.Sun, 0.1 * AU_KM);
  near(vesc, 133.20, 0.01);
  near(out.vInf_km_s, 36.84, 0.01);
  near(out.vInf_km_s, Math.sqrt((vesc + 5) ** 2 - vesc ** 2), 1e-9);
  near(out.log[0].oberth.analyticVInf_km_s, out.vInf_km_s, 1e-9);
  near(out.log[0].oberth.burnRadius_AU, 0.1, 1e-12);
  assert.equal(out.log[0].perihelionAdjust, undefined, 'already at target perihelion');
  near(out.totalDeltaV_km_s, 5, 1e-12);

  // Same 5 km/s on a parabola at 1 AU: sqrt(2·42.122·5 + 25) = sqrt(446.2) ≈ 21.12
  // km/s — burning 10× deeper yields ≈ 10^(1/4) ≈ 1.74× more v∞.
  const shallow = applyEvents({ e: 1, rp: 1 }, [{ type: 'oberthBurn', deltaV_km_s: 5 }]);
  near(shallow.vInf_km_s, 21.12, 0.01);
  assert.ok(out.vInf_km_s > 1.7 * shallow.vInf_km_s);

  // Analytic helper agrees and has no fake 2/sqrt(r) multiplier.
  near(oberthVInf(MU.Sun, 0.1 * AU_KM, vesc, 5), 36.84, 0.01);
});

test('oberthBurn with perihelion_AU retargets perihelion at aphelion and counts that Δv', () => {
  // Start on a 1 AU circle: dropping perihelion to 0.1 AU
  // needs v = sqrt(μ·(2/r − 2/(1.1 AU))) = 29.785·sqrt(2 − 1.818) = 12.70 km/s,
  // so Δv ≈ −17.08 km/s (retrograde).
  const out = applyEvents(circular1AU, [
    { type: 'oberthBurn', perihelion_AU: 0.1, deltaV_km_s: 5 }
  ]);
  const adj = out.log[0].perihelionAdjust;
  near(adj.toRp_AU, 0.1, 0);
  near(adj.deltaV_km_s, -17.08, 0.01);
  near(out.log[0].oberth.burnRadius_AU, 0.1, 1e-9);
  near(out.totalDeltaV_km_s, 17.08 + 5, 0.01);
  // At 0.1 AU on that ellipse v_p = 29.785·sqrt(20 − 1.818) = 127.0 km/s;
  // +5 → 132.0 < v_esc 133.2: still bound.
  near(out.log[0].oberth.vBefore_km_s, 127.0, 0.05);
  assert.equal(out.bound, true);
});

test('unsupported event types pass through with a warning and no state change', () => {
  const out = applyEvents(circular1AU, [
    { id: 't1', type: 'tetherRelease', deltaV_km_s: 2.5 },
    { id: 'ga', type: 'gravityAssist' },
    { id: 'x', type: 'warpDrive' }
  ]);
  assert.deepEqual(out.log.map((e) => e.status), ['skipped', 'skipped', 'skipped']);
  assert.match(out.log[0].warnings[0], /not modelled yet/);
  assert.match(out.log[1].warnings[0], /not modelled yet/);
  assert.match(out.log[2].warnings[0], /unknown event type/);
  near(out.finalElements.a, 1, 1e-12);
  assert.equal(out.totalDeltaV_km_s, 0);
});

test('impossible burn locations fall back to current position with a warning', () => {
  const hyp = { a: -1, e: 1.5, nu: 30, units: { a: 'AU', angles: 'deg' } };
  const out = applyEvents(hyp, [
    { type: 'burn', location: 'aphelion', deltaV_km_s: 1 },
    { type: 'burn', location: 'perihelion', deltaV_km_s: 1 }
  ]);
  assert.match(out.log[0].warnings[0], /no aphelion/);
  assert.match(out.log[1].warnings[0], /outbound/);
});

test('schema-example.json runs end to end and samples an ephemeris', () => {
  const doc = JSON.parse(readFileSync(new URL('./schema-example.json', import.meta.url), 'utf8'));
  const out = applyTrajectory(doc, { ephemerisSamples: 16 });
  assert.equal(out.log.length, doc.events.length);
  assert.deepEqual(out.log.map((e) => e.status), ['applied', 'applied', 'skipped']);
  assert.ok(out.log[1].perihelionAdjust, 'Oberth event retargets perihelion to 0.1 AU');
  near(out.log[1].oberth.burnRadius_AU, 0.1, 1e-9);
  assert.equal(out.ephemerisPoints.length, 16);
  for (const p of out.ephemerisPoints) {
    assert.equal(p.r_AU.length, 3);
    assert.ok(p.r_AU.every(Number.isFinite));
  }
  assert.ok(Number.isFinite(out.totalDeltaV_km_s));
});

test('hyperbolic ephemeris stays inside the asymptotes and radius cap', () => {
  const out = applyEvents(circular1AU, [{ type: 'burn', deltaV_km_s: 20 }], {
    ephemerisSamples: 50,
    ephemerisMaxRadius_AU: 30
  });
  for (const p of out.ephemerisPoints) {
    const r = Math.hypot(...p.r_AU);
    assert.ok(r <= 30 * (1 + 1e-9), `r = ${r}`);
  }
});

test('input validation', () => {
  assert.throws(() => applyEvents({ a: 1, e: 1.2 }, []), /hyperbolic orbits need a < 0/);
  assert.throws(() => applyEvents({ a: 1, e: 1 }, []), /parabolic elements need "rp"/);
  assert.throws(() => applyEvents({ type: 'cartesian', r: [1, 0, 0] }, []), /unsupported element type/);
  assert.throws(() => applyEvents(circular1AU, [], { centralBody: 'Vulcan' }), /unknown central body/);
});
