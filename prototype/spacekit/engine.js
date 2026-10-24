// Patched-conic / impulsive-Δv event engine for the 001c prototype.
//
// applyEvents(initialElements, events, options) →
//   { finalElements, vInf_km_s, asymptoticSpeed_km_s, fractionOfC, bound,
//     totalDeltaV_km_s, specificEnergy_km2_s2, finalState, ephemerisPoints, log }
//
// Model: a single two-body conic around one central body (the Sun by default).
// Burns are instantaneous velocity changes; the orbit is recomputed from the
// post-burn state vector. Speeds follow vis-viva, v² = μ(2/r − 1/a), with a < 0
// for hyperbolas. The Oberth effect is not a multiplier bolted on top: it falls
// out of burning where the probe is already fast (at perihelion), giving
// v∞ = sqrt((v_p + Δv)² − v_esc²).
//
// Gravity assists are patched conics: the flyby rotates v∞ relative to the
// flyby body by δ = 2·asin(1/e). Tether releases are impulsive Δv from a rigid
// rotating tether.
// Radial solar sails keep the state vector continuous and change the conic's
// parameter to μ(1 − β). Escape energy includes the remaining sail work βμ/r;
// it is measured at infinity where the true solar potential vanishes.
//
// Internal units: km, km/s, radians. Element input/output follows
// docs/ORBITAL_NOTATION.md (a in AU or km, angles in degrees).

const AU_KM = 1.495978707e8;
const C_KM_S = 299792.458;

// Gravitational parameters, km³/s².
const MU = {
  Sun: 1.32712440018e11,
  Venus: 324858.592,
  Earth: 398600.4418,
  Mars: 42828.37,
  Jupiter: 1.26686534e8,
  Saturn: 3.7931187e7,
  Uranus: 5.793939e6,
  Neptune: 6.836529e6
};

// Flyby bodies: equatorial radius (km) and mean heliocentric semi-major axis (AU).
const PLANETS = {
  Venus: { radius_km: 6051.8, a_AU: 0.72333566 },
  Earth: { radius_km: 6378.137, a_AU: 1.00000261 },
  Mars: { radius_km: 3396.19, a_AU: 1.52371034 },
  Jupiter: { radius_km: 71492, a_AU: 5.202887 },
  Saturn: { radius_km: 60268, a_AU: 9.53667594 },
  Uranus: { radius_km: 25559, a_AU: 19.18916464 },
  Neptune: { radius_km: 24764, a_AU: 30.06992276 }
};

const G0_KM_S2 = 9.80665e-3;

// |specific energy| / (μ/r_p) below this is treated as parabolic.
const PARABOLIC_TOL = 1e-12;
// Eccentricity / inclination below this is treated as circular / equatorial.
const SMALL = 1e-10;

const DEG = Math.PI / 180;
const TWO_PI = 2 * Math.PI;

// ---------- small vector helpers ----------

const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const scale = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0]
];
const norm = (a) => Math.sqrt(dot(a, a));
const unit = (a) => scale(a, 1 / norm(a));

// Wrap an angle to (−π, π].
function wrapPi(x) {
  let y = ((x + Math.PI) % TWO_PI + TWO_PI) % TWO_PI - Math.PI;
  if (y === -Math.PI) y = Math.PI;
  return y;
}

// Signed angle from `from` to `to`, measured positively about `axis`.
function signedAngle(from, to, axis) {
  return Math.atan2(dot(cross(from, to), axis), dot(from, to));
}

// Rotate `a` by angle θ about unit vector `k` (Rodrigues).
function rotate(a, k, theta) {
  const c = Math.cos(theta), s = Math.sin(theta);
  return add(add(scale(a, c), scale(cross(k, a), s)), scale(k, dot(k, a) * (1 - c)));
}

// ---------- scalar orbital relations ----------

/**
 * Vis-viva speed at radius r (km) on an orbit with semi-major axis a (km).
 * a < 0 for hyperbolas; a = ±Infinity for a parabola.
 */
function visViva(mu, r, a) {
  const inv = Number.isFinite(a) ? 1 / a : 0;
  const v2 = mu * (2 / r - inv);
  if (v2 < 0) {
    throw new RangeError(`r = ${r} km is beyond apoapsis of orbit with a = ${a} km`);
  }
  return Math.sqrt(v2);
}

/** Local escape speed sqrt(2μ/r). */
function escapeSpeed(mu, r) {
  return Math.sqrt((2 * mu) / r);
}

/** Circular speed sqrt(μ/r). */
function circularSpeed(mu, r) {
  return Math.sqrt(mu / r);
}

/**
 * Hyperbolic excess speed from speed v at radius r. Returns null when bound
 * (negative energy) and 0 for a parabola.
 */
function vInfinity(mu, r, v) {
  const vEsc2 = (2 * mu) / r;
  const diff = v * v - vEsc2;
  if (Math.abs(diff) <= PARABOLIC_TOL * vEsc2) return 0;
  return diff > 0 ? Math.sqrt(diff) : null;
}

/**
 * Analytic Oberth result for a prograde burn Δv at perihelion r_p where the
 * pre-burn speed is v_p: v∞ = sqrt((v_p + Δv)² − v_esc²), null if still bound.
 */
function oberthVInf(mu, rp, vp, dv) {
  return vInfinity(mu, rp, vp + dv);
}

/**
 * Unpowered flyby turn angle (rad): δ = 2·asin(1/e), e = 1 + r_p v∞²/μ.
 */
function flybyTurnAngle(mu, rp, vInf) {
  return 2 * Math.asin(1 / (1 + (rp * vInf * vInf) / mu));
}

/**
 * Patched-conic flyby with an optional impulsive Δv at periapsis (along the
 * periapsis velocity; negative = retrograde). The inbound and outbound legs are
 * separate hyperbolas sharing r_p, so δ = asin(1/e_in) + asin(1/e_out).
 * Returns null when the burn captures the probe (v_p,out ≤ v_esc at r_p).
 */
function poweredFlyby(mu, rp, vInfIn, dv = 0) {
  const vEsc2 = (2 * mu) / rp;
  const vpIn = Math.sqrt(vInfIn * vInfIn + vEsc2);
  const vpOut = vpIn + dv;
  const vInfOut2 = vpOut * vpOut - vEsc2;
  if (vpOut <= 0 || vInfOut2 <= 0) return null;
  const vInfOut = Math.sqrt(vInfOut2);
  const eIn = 1 + (rp * vInfIn * vInfIn) / mu;
  const eOut = 1 + (rp * vInfOut2) / mu;
  return {
    vpIn,
    vpOut,
    vInfOut,
    eIn,
    eOut,
    turnAngle: Math.asin(1 / eIn) + Math.asin(1 / eOut)
  };
}

/**
 * Δv given to a payload released from a rigid rotating tether, where tipSpeed is
 * the payload speed relative to the facility (hub) and massRatio = M_facility /
 * m_payload. Momentum conservation about the common centre of mass gives
 * Δv_payload = tipSpeed · M/(M + m); the facility recoils by −Δv_payload / massRatio.
 */
function tetherDeltaV(tipSpeed, massRatio = Infinity) {
  if (!(massRatio > 0)) throw new RangeError('tether massRatio must be > 0');
  return Number.isFinite(massRatio) ? (tipSpeed * massRatio) / (1 + massRatio) : tipSpeed;
}

// ---------- element ↔ state conversion ----------

/**
 * Classical elements (km, rad) → inertial state { r: [km], v: [km/s] }.
 * Elements: { p, e, i, raan, argp, nu } — semi-latus rectum p is used so that
 * parabolas (a = ∞) are representable.
 */
function elementsToState(el, mu) {
  const { p, e, i, raan, argp, nu } = el;
  const denom = 1 + e * Math.cos(nu);
  if (denom <= 0) {
    throw new RangeError(`true anomaly ${nu / DEG}° is outside the asymptotes for e = ${e}`);
  }
  const r = p / denom;
  const rPf = [r * Math.cos(nu), r * Math.sin(nu)];
  const s = Math.sqrt(mu / p);
  const vPf = [-s * Math.sin(nu), s * (e + Math.cos(nu))];

  const cO = Math.cos(raan), sO = Math.sin(raan);
  const cw = Math.cos(argp), sw = Math.sin(argp);
  const ci = Math.cos(i), si = Math.sin(i);
  const P = [cO * cw - sO * sw * ci, sO * cw + cO * sw * ci, sw * si];
  const Q = [-cO * sw - sO * cw * ci, -sO * sw + cO * cw * ci, cw * si];

  return {
    r: add(scale(P, rPf[0]), scale(Q, rPf[1])),
    v: add(scale(P, vPf[0]), scale(Q, vPf[1]))
  };
}

/**
 * Inertial state → classical elements (km, rad). Handles elliptic, parabolic
 * and hyperbolic orbits plus circular / equatorial degeneracies (raan = 0 for
 * equatorial, argp = 0 for circular, with nu measured from the fallback
 * reference direction).
 */
function stateToElements(r, v, mu) {
  const rMag = norm(r);
  const vMag = norm(v);
  const h = cross(r, v);
  const hMag = norm(h);
  if (hMag === 0) throw new RangeError('rectilinear (radial) trajectories are not supported');
  const hHat = scale(h, 1 / hMag);

  const eVec = scale(
    add(scale(r, vMag * vMag - mu / rMag), scale(v, -dot(r, v))),
    1 / mu
  );
  const e = norm(eVec);
  const energy = (vMag * vMag) / 2 - mu / rMag;
  const p = (hMag * hMag) / mu;
  const rp = p / (1 + e);
  const parabolic = Math.abs(energy) <= PARABOLIC_TOL * (mu / rp);
  const a = parabolic ? Infinity : -mu / (2 * energy);

  // atan2 keeps precision near i = 0 / 180° where acos(h_z/h) does not.
  const i = Math.atan2(Math.hypot(h[0], h[1]), h[2]);
  const nVec = [-h[1], h[0], 0];
  const equatorial = norm(nVec) <= SMALL * hMag;
  const nodeRef = equatorial ? [1, 0, 0] : unit(nVec);
  const raan = equatorial ? 0 : Math.atan2(nVec[1], nVec[0]);

  const circular = e <= SMALL;
  const argp = circular ? 0 : signedAngle(nodeRef, eVec, hHat);
  const periRef = circular ? nodeRef : unit(eVec);
  const nu = signedAngle(periRef, r, hHat);

  return {
    p,
    a,
    e: circular ? 0 : e,
    i,
    raan: (raan + TWO_PI) % TWO_PI,
    argp: (argp + TWO_PI) % TWO_PI,
    nu: wrapPi(nu),
    rp,
    energy
  };
}

// ---------- schema adapters ----------

function aScale(units) {
  const u = (units && units.a) || 'AU';
  if (u === 'AU') return AU_KM;
  if (u === 'km') return 1;
  throw new Error(`unsupported length unit "${u}" (use "AU" or "km")`);
}

function angleScale(units) {
  const u = (units && units.angles) || 'deg';
  if (u === 'deg') return DEG;
  if (u === 'rad') return 1;
  throw new Error(`unsupported angle unit "${u}" (use "deg" or "rad")`);
}

/**
 * Schema elements → internal (km, rad, with p). Accepts `a`, or `rp`
 * (periapsis distance, same unit as a) — `rp` is required for parabolas.
 */
function fromSchemaElements(el) {
  if (!el || (el.type && el.type !== 'keplerian')) {
    throw new Error(`unsupported element type "${el && el.type}" (only "keplerian" for now)`);
  }
  const L = aScale(el.units);
  const A = angleScale(el.units);
  const e = el.e ?? 0;
  if (e < 0) throw new RangeError('eccentricity must be ≥ 0');

  let p;
  if (el.rp != null) {
    p = el.rp * L * (1 + e);
  } else if (el.a != null) {
    const a = el.a * L;
    if (Math.abs(e - 1) < SMALL) throw new Error('parabolic elements need "rp", not "a"');
    if (e < 1 && a <= 0) throw new RangeError('elliptic orbits need a > 0');
    if (e > 1 && a >= 0) throw new RangeError('hyperbolic orbits need a < 0');
    p = a * (1 - e * e);
  } else {
    throw new Error('elements need either "a" or "rp"');
  }

  return {
    p,
    e,
    i: (el.i ?? 0) * A,
    raan: (el.raan ?? 0) * A,
    argp: (el.argp ?? 0) * A,
    nu: wrapPi((el.nu ?? 0) * A)
  };
}

/** Internal elements → schema elements (AU, deg). */
function toSchemaElements(k) {
  return {
    type: 'keplerian',
    a: Number.isFinite(k.a) ? k.a / AU_KM : null, // null for a parabola
    e: k.e,
    i: k.i / DEG,
    raan: k.raan / DEG,
    argp: k.argp / DEG,
    nu: k.nu / DEG,
    rp: k.rp / AU_KM,
    units: { a: 'AU', angles: 'deg' }
  };
}

function deltaVScale(units) {
  const u = units || 'km/s';
  if (u === 'km/s') return 1;
  if (u === 'm/s') return 1e-3;
  throw new Error(`unsupported Δv unit "${u}" (use "km/s" or "m/s")`);
}

// ---------- engine state ----------

function makeState(k, mu) {
  const sv = elementsToState(k, mu);
  return { r: sv.r, v: sv.v, mu };
}

function describe(state) {
  const k = stateToElements(state.r, state.v, state.mu);
  const rMag = norm(state.r);
  const speed = norm(state.v);
  return {
    r_AU: rMag / AU_KM,
    speed_km_s: speed,
    a_AU: Number.isFinite(k.a) ? k.a / AU_KM : null,
    e: k.e,
    rp_AU: k.rp / AU_KM,
    vInf_km_s: vInfinity(state.mu, rMag, speed),
    gravityOnlyVInf_km_s: vInfinity(state.trueMu, rMag, speed)
  };
}

function isBound(state) {
  const k = stateToElements(state.r, state.v, state.mu);
  return Number.isFinite(k.a) && k.a > 0;
}

/** Move along the current conic to true anomaly nu (rad). No time is modelled. */
function moveTo(state, nu) {
  const k = stateToElements(state.r, state.v, state.mu);
  const sv = elementsToState({ ...k, nu }, state.mu);
  state.r = sv.r;
  state.v = sv.v;
}

/**
 * Move to an apsis or explicit true anomaly. Returns a warning string when the
 * request is physically unreachable (e.g. aphelion of a hyperbola) and the burn
 * will instead happen at the current position.
 */
function moveToLocation(state, location) {
  if (location == null || location === 'current') return null;
  const k = stateToElements(state.r, state.v, state.mu);
  const bound = Number.isFinite(k.a) && k.a > 0;

  if (location === 'perihelion' || location === 'periapsis') {
    if (!bound && k.nu > SMALL) {
      return 'probe is outbound on an unbound orbit and will not reach perihelion again; burning at current position';
    }
    moveTo(state, 0);
    return null;
  }
  if (location === 'aphelion' || location === 'apoapsis') {
    if (!bound) return 'unbound orbit has no aphelion; burning at current position';
    moveTo(state, Math.PI);
    return null;
  }
  if (typeof location === 'number') {
    const nu = wrapPi(location * DEG);
    if (!bound && 1 + k.e * Math.cos(nu) <= 0) {
      return `true anomaly ${location}° is outside the asymptotes; burning at current position`;
    }
    moveTo(state, nu);
    return null;
  }
  throw new Error(`unsupported burn location "${location}"`);
}

/** Δv vector (km/s, inertial) for a named direction at the current state. */
function directionVector(state, direction) {
  const vHat = unit(state.v);
  const hHat = unit(cross(state.r, state.v));
  const rHat = unit(state.r);
  switch (direction || 'prograde') {
    case 'prograde': return vHat;
    case 'retrograde': return scale(vHat, -1);
    case 'normal': return hHat;
    case 'antinormal': return scale(hHat, -1);
    case 'radial':
    case 'radialOut': return rHat;
    case 'radialIn': return scale(rHat, -1);
    default: throw new Error(`unsupported burn direction "${direction}"`);
  }
}

/**
 * Resolve an event's Δv to an inertial vector (km/s). Accepts either
 *  - `deltaV_km_s` (magnitude) + optional `direction`, or
 *  - `deltaV: [dV, dN, dC]` + optional `units`, in the local VNC frame
 *    (V = along velocity, N = orbit normal, C = V × N ≈ radially outward).
 */
function resolveDeltaV(state, ev) {
  if (Array.isArray(ev.deltaV)) {
    const s = deltaVScale(ev.units);
    const vHat = unit(state.v);
    const nHat = unit(cross(state.r, state.v));
    const cHat = cross(vHat, nHat);
    const [dV, dN, dC] = ev.deltaV.map((x) => x * s);
    return add(add(scale(vHat, dV), scale(nHat, dN)), scale(cHat, dC));
  }
  const mag = ev.deltaV_km_s ?? 0;
  return scale(directionVector(state, ev.direction), mag);
}

function impulse(state, dv) {
  state.v = add(state.v, dv);
}

// ---------- event handlers ----------

/** Constant-power reflective cavity: integrate F = 2 N P / c over the shot.
 * Like ideas_calc.py, collapse the short boost to the current launch position;
 * this is not finite-thrust propagation or an optical cavity simulation.
 */
function handleLaserCavityBoost(state, ev, entry) {
  for (const key of ['power_MW', 'duration_s', 'probeMass_kg']) {
    if (!Number.isFinite(ev[key]) || ev[key] <= 0) {
      throw new RangeError(`laserCavityBoost ${key} must be finite and positive`);
    }
  }
  if (!Number.isFinite(ev.recyclingFactor) || ev.recyclingFactor < 1) {
    throw new RangeError('laserCavityBoost recyclingFactor must be finite and ≥ 1');
  }
  if (!['prograde', 'retrograde', 'radial', 'normal', 'radialOut'].includes(ev.direction)) {
    throw new Error('laserCavityBoost requires a supported direction');
  }
  const circulatingPower_MW = ev.power_MW * ev.recyclingFactor;
  const force_N = 2 * circulatingPower_MW * 1e6 / (C_KM_S * 1e3);
  const acceleration_m_s2 = force_N / ev.probeMass_kg;
  const dv = acceleration_m_s2 * ev.duration_s / 1e3;
  if (![circulatingPower_MW, force_N, acceleration_m_s2, dv].every(Number.isFinite)) {
    throw new RangeError('laserCavityBoost parameters overflow the boost calculation');
  }
  impulse(state, scale(directionVector(state, ev.direction), dv));
  entry.laserCavity = {
    power_MW: ev.power_MW,
    circulatingPower_MW,
    duration_s: ev.duration_s,
    recyclingFactor: ev.recyclingFactor,
    probeMass_kg: ev.probeMass_kg,
    force_N,
    acceleration_m_s2,
    acceleration_g: acceleration_m_s2 / (G0_KM_S2 * 1e3),
    inputEnergy_J: ev.power_MW * 1e6 * ev.duration_s,
    boostDistance_km: 0.5 * dv * ev.duration_s,
    model: 'constant-power thrust integrated at launch position; no finite-thrust propagation'
  };
  return dv;
}

function sailMu(mu, beta, centralBody) {
  // The attractive-conic solver cannot represent zero or repulsive gravity.
  if (!Number.isFinite(beta) || beta < 0 || beta >= 1) {
    throw new RangeError('solarSail beta must be finite and satisfy 0 ≤ beta < 1');
  }
  if (beta !== 0 && centralBody !== 'Sun') throw new Error('solarSail requires centralBody Sun');
  return mu * (1 - beta);
}

function handleSolarSail(state, ev, entry) {
  if (state.centralBody !== 'Sun') throw new Error('solarSail requires centralBody Sun');
  const mu = sailMu(state.trueMu, ev.beta, state.centralBody);
  const warn = moveToLocation(state, ev.location ?? 'current');
  if (warn) entry.warnings.push(warn);
  const previousBeta = state.sailBeta;
  state.sailBeta = ev.beta;
  state.mu = mu;
  entry.sail = {
    previousBeta,
    beta: ev.beta,
    radius_AU: norm(state.r) / AU_KM,
    effectiveMu_km3_s2: mu,
    remainingWork_km2_s2: ev.beta * state.trueMu / norm(state.r)
  };
  return 0; // Continuous radiation pressure is not an impulsive Δv.
}

function handleBurn(state, ev, entry) {
  const warn = moveToLocation(state, ev.location ?? (ev.nu_deg ?? 'current'));
  if (warn) entry.warnings.push(warn);
  const dv = resolveDeltaV(state, ev);
  impulse(state, dv);
  return norm(dv);
}

function handleOberthBurn(state, ev, entry) {
  let spent = 0;
  const mu = state.mu;

  if (ev.perihelion_AU != null) {
    const target = ev.perihelion_AU * AU_KM;
    const k = stateToElements(state.r, state.v, mu);
    if (Math.abs(k.rp - target) > 1e-9 * target) {
      if (Number.isFinite(k.a) && k.a > 0) {
        // Single tangential burn at aphelion sets the new perihelion.
        moveTo(state, Math.PI);
        const ra = norm(state.r);
        const vNow = norm(state.v);
        const vNeed = visViva(mu, ra, (ra + target) / 2);
        const dvAdjust = vNeed - vNow;
        impulse(state, scale(unit(state.v), dvAdjust));
        spent += Math.abs(dvAdjust);
        entry.perihelionAdjust = {
          fromRp_AU: k.rp / AU_KM,
          toRp_AU: ev.perihelion_AU,
          atRadius_AU: ra / AU_KM,
          deltaV_km_s: dvAdjust
        };
      } else {
        entry.warnings.push(
          `cannot retarget perihelion to ${ev.perihelion_AU} AU on an unbound orbit; using current perihelion ${(k.rp / AU_KM).toPrecision(6)} AU`
        );
      }
    }
  }

  const warn = moveToLocation(state, 'perihelion');
  if (warn) entry.warnings.push(warn);

  const r = norm(state.r);
  const vp = norm(state.v);
  const dv = resolveDeltaV(state, { ...ev, direction: ev.direction || 'prograde' });
  impulse(state, dv);
  spent += norm(dv);

  entry.oberth = {
    burnRadius_AU: r / AU_KM,
    vBefore_km_s: vp,
    vEsc_km_s: escapeSpeed(mu, r),
    // Analytic check, valid for a purely prograde burn at perihelion.
    analyticVInf_km_s: warn ? null : oberthVInf(mu, r, vp, ev.deltaV_km_s ?? 0)
  };
  return spent;
}

/**
 * Momentum-exchange tether release. Assumptions: rigid, massless tether much
 * shorter than the orbital radius (release point = current position), impulsive
 * release, and the facility + payload centre of mass on the probe's current
 * conic. The Δv is applied along `direction` at `location`, like a burn.
 */
function handleTetherRelease(state, ev, entry) {
  let tipSpeed = ev.tipSpeed_km_s ?? null;
  if (tipSpeed == null && ev.tetherLength_km != null && ev.rotationPeriod_s != null) {
    tipSpeed = (TWO_PI * ev.tetherLength_km) / ev.rotationPeriod_s;
  }
  const massRatio = ev.massRatio ?? Infinity;
  let dv;
  if (tipSpeed != null) {
    dv = tetherDeltaV(tipSpeed, massRatio);
    if (ev.deltaV_km_s != null) {
      entry.warnings.push('tip speed given; ignoring deltaV_km_s');
    }
  } else if (ev.deltaV_km_s != null) {
    if (!(massRatio > 0)) throw new RangeError('tether massRatio must be > 0');
    dv = ev.deltaV_km_s;
  } else {
    throw new Error('tetherRelease needs tipSpeed_km_s, tetherLength_km + rotationPeriod_s, or deltaV_km_s');
  }

  const warn = moveToLocation(state, ev.location ?? 'current');
  if (warn) entry.warnings.push(warn);
  const direction = ev.direction || 'prograde';
  impulse(state, scale(directionVector(state, direction), dv));

  entry.tether = {
    tipSpeed_km_s: tipSpeed,
    massRatio: Number.isFinite(massRatio) ? massRatio : null,
    direction,
    payloadDeltaV_km_s: dv,
    facilityRecoil_km_s: Number.isFinite(massRatio) ? -dv / massRatio : 0,
    // Payload swings at radius L·M/(M+m) about the centre of mass at ω = tipSpeed/L.
    payloadAcceleration_g:
      tipSpeed != null && ev.tetherLength_km != null
        ? Math.abs((tipSpeed * dv) / ev.tetherLength_km) / G0_KM_S2
        : null
  };
  return Math.abs(dv);
}

/** Flyby body parameters from the planet table plus per-event overrides. */
function flybyBody(ev) {
  const table = PLANETS[ev.body] || {};
  const body = {
    name: ev.body ?? null,
    mu: ev.mu_km3_s2 ?? MU[ev.body],
    radius_km: ev.bodyRadius_km ?? table.radius_km,
    orbit_AU: ev.bodyOrbit_AU ?? table.a_AU
  };
  if (!body.mu) throw new Error(`unknown flyby body "${ev.body}" (pass mu_km3_s2)`);
  return body;
}

/**
 * Move to the outbound crossing of the body's orbital radius. Returns a
 * warning string when the conic never reaches it (or has already passed it).
 */
function moveToEncounter(state, rBody) {
  const k = stateToElements(state.r, state.v, state.mu);
  const bound = Number.isFinite(k.a) && k.a > 0;
  const miss = `orbit does not reach the flyby body's orbital radius ${(rBody / AU_KM).toPrecision(6)} AU`;
  if (k.e === 0) {
    return Math.abs(k.p - rBody) <= 1e-9 * rBody ? null : miss;
  }
  const cosNu = (k.p / rBody - 1) / k.e;
  if (Math.abs(cosNu) > 1 + 1e-9) return miss;
  const nu = Math.acos(Math.max(-1, Math.min(1, cosNu)));
  if (!bound && k.nu > nu + 1e-12) return `${miss} again (already outbound past it)`;
  moveTo(state, nu);
  return null;
}

/**
 * Patched-conic gravity assist. Assumptions: zero-radius sphere of influence at
 * the probe's position; the body moves on a circular, prograde orbit in the
 * reference (x–y) plane, so v_body = sqrt(μ_central/r)·(ẑ × r̂); v∞_in is the
 * probe velocity relative to the body. The flyby rotates v∞ by δ and, if
 * deltaV_km_s is given, changes its magnitude via a periapsis burn.
 *
 * Periapsis comes from `periapsis_km` (from the body's centre) or
 * `periapsisAltitude_km`. With neither, an unpowered flyby solves r_p from
 * `turnAngle_deg`: r_p = μ/v∞² · (1/sin(δ/2) − 1). With both, `turnAngle_deg`
 * is only checked against the computed δ.
 *
 * The rotation axis defaults to v∞_in × v_body ("trailing" pass, turning v∞
 * toward the body's velocity = maximum heliocentric energy gain). `side:
 * 'leading'` or `bPlaneAngle_deg` rotates that axis about v∞_in (0° trailing,
 * 180° leading, ±90° out of plane).
 */
function handleGravityAssist(state, ev, entry) {
  const body = flybyBody(ev);
  let dv = ev.deltaV_km_s ?? 0;
  if (ev.direction === 'retrograde') {
    dv = -dv;
  } else if (ev.direction != null && ev.direction !== 'prograde') {
    throw new Error(`unsupported flyby burn direction "${ev.direction}" (use "prograde" or "retrograde")`);
  }

  let rp = null;
  if (ev.periapsis_km != null) {
    rp = ev.periapsis_km;
  } else if (ev.periapsisAltitude_km != null) {
    if (body.radius_km == null) throw new Error('periapsisAltitude_km needs a body radius (pass bodyRadius_km)');
    rp = body.radius_km + ev.periapsisAltitude_km;
  } else if (ev.turnAngle_deg == null) {
    throw new Error('gravityAssist needs periapsis_km, periapsisAltitude_km or turnAngle_deg');
  } else if (dv !== 0) {
    throw new Error('a powered gravityAssist needs periapsis_km or periapsisAltitude_km');
  }
  if (rp != null && !(rp > 0)) throw new RangeError('flyby periapsis radius must be > 0');

  const saved = { r: state.r, v: state.v };
  const skip = (msg) => {
    state.r = saved.r;
    state.v = saved.v;
    entry.status = 'skipped';
    entry.warnings.push(`${msg}; no state change`);
    return 0;
  };

  if ((ev.location ?? 'encounter') === 'encounter') {
    if (body.orbit_AU == null) throw new Error('encounter location needs bodyOrbit_AU');
    const warn = moveToEncounter(state, body.orbit_AU * AU_KM);
    if (warn) return skip(warn);
  } else if (ev.location !== 'current') {
    throw new Error(`unsupported flyby location "${ev.location}" (use "encounter" or "current")`);
  }

  const rMag = norm(state.r);
  const tangent = cross([0, 0, 1], state.r);
  if (norm(tangent) <= SMALL * rMag) throw new RangeError('flyby position is on the reference-plane pole');
  const vBody = scale(unit(tangent), circularSpeed(state.trueMu, rMag));
  const vInfInVec = add(state.v, scale(vBody, -1));
  const vInfIn = norm(vInfInVec);
  if (vInfIn === 0) return skip('probe is co-moving with the flyby body (v∞ = 0)');

  if (rp == null) {
    rp = (body.mu / (vInfIn * vInfIn)) * (1 / Math.sin((ev.turnAngle_deg * DEG) / 2) - 1);
  }
  if (body.radius_km != null && rp < body.radius_km) {
    entry.warnings.push(`periapsis ${rp.toPrecision(6)} km is below the surface of ${body.name} (${body.radius_km} km)`);
  }

  const fb = poweredFlyby(body.mu, rp, vInfIn, dv);
  if (!fb) return skip('periapsis burn captures the probe at the flyby body');
  if (ev.turnAngle_deg != null && Math.abs(fb.turnAngle / DEG - ev.turnAngle_deg) > 1e-6) {
    entry.warnings.push(
      `turnAngle_deg ${ev.turnAngle_deg}° does not match ${(fb.turnAngle / DEG).toPrecision(6)}° from periapsis and v∞; using the computed angle`
    );
  }

  const vHat = scale(vInfInVec, 1 / vInfIn);
  let axis = cross(vHat, vBody);
  // v∞ parallel to the body's velocity: turn within the reference plane.
  axis = norm(axis) > SMALL * norm(vBody) ? unit(axis) : [0, 0, 1];
  const bPlaneAngle = (ev.bPlaneAngle_deg ?? (ev.side === 'leading' ? 180 : 0)) * DEG;
  axis = rotate(axis, vHat, bPlaneAngle);

  const vInfOutVec = scale(rotate(vHat, axis, fb.turnAngle), fb.vInfOut);
  const vBefore = state.v;
  state.v = add(vBody, vInfOutVec);

  entry.flyby = {
    body: body.name,
    encounterRadius_AU: rMag / AU_KM,
    bodyVelocity_km_s: vBody,
    periapsis_km: rp,
    periapsisAltitude_km: body.radius_km != null ? rp - body.radius_km : null,
    vInfIn_km_s: vInfIn,
    vInfOut_km_s: fb.vInfOut,
    eccentricityIn: fb.eIn,
    eccentricityOut: fb.eOut,
    turnAngle_deg: fb.turnAngle / DEG,
    periapsisSpeedIn_km_s: fb.vpIn,
    periapsisDeltaV_km_s: dv,
    heliocentricSpeedBefore_km_s: norm(vBefore),
    heliocentricSpeedAfter_km_s: norm(state.v),
    heliocentricDeltaV_km_s: norm(add(state.v, scale(vBefore, -1)))
  };
  // Only the propulsive periapsis burn counts toward the Δv budget.
  return Math.abs(dv);
}

const HANDLERS = {
  laserCavityBoost: handleLaserCavityBoost,
  burn: handleBurn,
  oberthBurn: handleOberthBurn,
  tetherRelease: handleTetherRelease,
  solarSail: handleSolarSail,
  gravityAssist: handleGravityAssist
};

// Recognised in the schema but not yet modelled (separate issues).
const DEFERRED_TYPES = new Set(['hitchhike']);

// ---------- public API ----------

/**
 * Apply a sequence of events to initial elements.
 *
 * @param {object} initialElements schema elements (see docs/ORBITAL_NOTATION.md)
 * @param {object[]} events
 * @param {object} [options]
 * @param {string} [options.centralBody='Sun']
 * @param {number} [options.mu] override gravitational parameter, km³/s²
 * @param {number} [options.sailBeta=0] active sail when resuming effective elements
 * @param {number} [options.ephemerisSamples=0] points to sample on the final conic
 * @param {number} [options.ephemerisMaxRadius_AU=100] radius cap for unbound sampling
 */
function applyEvents(initialElements, events = [], options = {}) {
  const centralBody = options.centralBody || 'Sun';
  const mu = options.mu ?? MU[centralBody];
  if (!mu) throw new Error(`unknown central body "${centralBody}" (pass options.mu)`);

  const sailBeta = options.sailBeta ?? 0;
  const state = {
    ...makeState(fromSchemaElements(initialElements), sailMu(mu, sailBeta, centralBody)),
    trueMu: mu, centralBody, sailBeta
  };
  const log = [];
  let totalDeltaV = 0;

  events.forEach((ev, index) => {
    const entry = {
      index,
      id: ev.id ?? null,
      type: ev.type,
      status: 'applied',
      warnings: [],
      before: describe(state)
    };
    const handler = HANDLERS[ev.type];
    if (handler) {
      entry.deltaV_km_s = handler(state, ev, entry);
      totalDeltaV += entry.deltaV_km_s;
    } else {
      entry.status = 'skipped';
      entry.warnings.push(
        DEFERRED_TYPES.has(ev.type)
          ? `event type "${ev.type}" is not modelled yet; passed through with no state change`
          : `unknown event type "${ev.type}"; passed through with no state change`
      );
    }
    entry.after = describe(state);
    log.push(entry);
  });

  const k = stateToElements(state.r, state.v, state.mu);
  const rMag = norm(state.r);
  // E∞ = (v²/2 − μ_true/r) + βμ_true/r, not gravity-only local energy.
  const vInf = vInfinity(state.mu, rMag, norm(state.v));
  const bound = vInf === null;

  return {
    centralBody,
    sailBeta: state.sailBeta,
    effectiveMu_km3_s2: state.mu,
    finalElements: toSchemaElements(k),
    bound,
    vInf_km_s: vInf,
    asymptoticSpeed_km_s: vInf,
    fractionOfC: bound ? null : vInf / C_KM_S,
    totalDeltaV_km_s: totalDeltaV,
    specificEnergy_km2_s2: k.energy,
    gravityOnlySpecificEnergy_km2_s2: norm(state.v) ** 2 / 2 - mu / rMag,
    finalState: { r_km: state.r, v_km_s: state.v },
    ephemerisPoints: sampleConic(k, state.mu, options.ephemerisSamples ?? 0, options.ephemerisMaxRadius_AU ?? 100),
    log
  };
}

/** Convenience wrapper for a full trajectory document (schema-example.json). */
function applyTrajectory(doc, options = {}) {
  return applyEvents(doc.initialElements, doc.events, {
    centralBody: doc.centralBody,
    ...options
  });
}

/** Sample n points along a conic: { nu_deg, r_AU: [x,y,z], v_km_s: [x,y,z] }. */
function sampleConic(k, mu, n, maxRadius_AU) {
  if (!n || n < 2) return [];
  // Energy classification can identify a parabola with e a few ulps below 1.
  // Use the parabolic value so it stays an open, radius-capped preview arc.
  if (!Number.isFinite(k.a)) k = { ...k, e: 1 };
  let nuMax;
  if (k.e < 1) {
    nuMax = Math.PI;
  } else {
    // Stay inside the asymptotes and within the radius cap.
    const rMax = maxRadius_AU * AU_KM;
    const nuAsym = Math.acos(-1 / k.e);
    const cosCap = (k.p / rMax - 1) / k.e;
    nuMax = cosCap <= -1 ? nuAsym * (1 - 1e-6) : Math.min(nuAsym * (1 - 1e-6), Math.acos(Math.min(1, cosCap)));
  }
  const pts = [];
  for (let j = 0; j < n; j++) {
    const nu = -nuMax + (2 * nuMax * j) / (n - 1);
    const sv = elementsToState({ ...k, nu }, mu);
    pts.push({ nu_deg: nu / DEG, r_AU: scale(sv.r, 1 / AU_KM), v_km_s: sv.v });
  }
  return pts;
}

if (typeof window !== 'undefined') {
  window.applyEvents = applyEvents;
  window.applyTrajectory = applyTrajectory;
}

export {
  AU_KM,
  C_KM_S,
  MU,
  PLANETS,
  applyEvents,
  applyTrajectory,
  circularSpeed,
  elementsToState,
  escapeSpeed,
  flybyTurnAngle,
  oberthVInf,
  poweredFlyby,
  stateToElements,
  tetherDeltaV,
  vInfinity,
  visViva
};
