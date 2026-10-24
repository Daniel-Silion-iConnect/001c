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
// Internal units: km, km/s, radians. Element input/output follows
// docs/ORBITAL_NOTATION.md (a in AU or km, angles in degrees).

const AU_KM = 1.495978707e8;
const C_KM_S = 299792.458;

// Gravitational parameters, km³/s².
const MU = {
  Sun: 1.32712440018e11,
  Earth: 398600.4418,
  Jupiter: 1.26686534e8
};

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
    vInf_km_s: vInfinity(state.mu, rMag, speed)
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

const HANDLERS = {
  burn: handleBurn,
  oberthBurn: handleOberthBurn
};

// Recognised in the schema but not yet modelled (separate issues).
const DEFERRED_TYPES = new Set(['tetherRelease', 'gravityAssist', 'hitchhike']);

// ---------- public API ----------

/**
 * Apply a sequence of events to initial elements.
 *
 * @param {object} initialElements schema elements (see docs/ORBITAL_NOTATION.md)
 * @param {object[]} events
 * @param {object} [options]
 * @param {string} [options.centralBody='Sun']
 * @param {number} [options.mu] override gravitational parameter, km³/s²
 * @param {number} [options.ephemerisSamples=0] points to sample on the final conic
 * @param {number} [options.ephemerisMaxRadius_AU=100] radius cap for unbound sampling
 */
function applyEvents(initialElements, events = [], options = {}) {
  const centralBody = options.centralBody || 'Sun';
  const mu = options.mu ?? MU[centralBody];
  if (!mu) throw new Error(`unknown central body "${centralBody}" (pass options.mu)`);

  const state = makeState(fromSchemaElements(initialElements), mu);
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

  const k = stateToElements(state.r, state.v, mu);
  const rMag = norm(state.r);
  const vInf = vInfinity(mu, rMag, norm(state.v));
  const bound = vInf === null;

  return {
    centralBody,
    finalElements: toSchemaElements(k),
    bound,
    vInf_km_s: vInf,
    asymptoticSpeed_km_s: vInf,
    fractionOfC: bound ? null : vInf / C_KM_S,
    totalDeltaV_km_s: totalDeltaV,
    specificEnergy_km2_s2: k.energy,
    finalState: { r_km: state.r, v_km_s: state.v },
    ephemerisPoints: sampleConic(k, mu, options.ephemerisSamples ?? 0, options.ephemerisMaxRadius_AU ?? 100),
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
  applyEvents,
  applyTrajectory,
  circularSpeed,
  elementsToState,
  escapeSpeed,
  oberthVInf,
  stateToElements,
  vInfinity,
  visViva
};
