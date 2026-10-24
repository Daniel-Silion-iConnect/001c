// Browser/Node helpers. The viewer adapts schema inputs without changing the engine.
import { AU_KM, C_KM_S, MU, applyEvents, elementsToState, stateToElements } from './engine.js';

export function validateScenario(doc) {
  const require = (condition, message) => {
    if (!condition) throw new Error(message);
  };
  const number = (value) => typeof value === 'number' && Number.isFinite(value);
  const vector = (value) => Array.isArray(value) && value.length === 3 && value.every(number);
  require(doc && typeof doc === 'object' && !Array.isArray(doc), 'Scenario must be an object.');
  require(typeof doc.epoch === 'string' && /T.*(?:Z|[+-]\d{2}:\d{2})$/i.test(doc.epoch)
    && Number.isFinite(Date.parse(doc.epoch)), 'epoch must be a date-time with timezone.');
  require(Object.hasOwn(MU, doc.centralBody), 'centralBody must be Sun, Earth, or Jupiter.');
  require(['ICRS', 'ECLIPJ2000'].includes(doc.frame), 'frame must be ICRS or ECLIPJ2000.');
  require(doc.name === undefined || (typeof doc.name === 'string' && doc.name.trim()), 'name must be a nonempty string.');
  const el = doc.initialElements;
  require(el && typeof el === 'object', 'initialElements is required.');
  if (el.type === 'cartesian') {
    require(vector(el.r) && vector(el.v), 'Cartesian r and v must be finite three-vectors.');
    require(['AU', 'km'].includes(el.units?.r) && el.units?.v === 'km/s', 'Cartesian units must specify r: AU or km, v: km/s.');
    require(Math.hypot(...el.r) > 0, 'Initial position must be nonzero.');
  } else {
    require(el.type === 'keplerian', 'initialElements.type must be keplerian or cartesian.');
    require(['a', 'e', 'i', 'raan', 'argp'].every(key => number(el[key])), 'Keplerian a, e, i, raan, and argp must be finite numbers.');
    require((el.a > 0 && el.e >= 0 && el.e < 1) || (el.a < 0 && el.e > 1), 'Use a > 0, 0 ≤ e < 1 for ellipses or a < 0, e > 1 for hyperbolas.');
    require(el.i >= 0 && el.i <= 180, 'Inclination must be between 0 and 180 degrees.');
    require(Object.hasOwn(el, 'nu') !== Object.hasOwn(el, 'M') && number(el.nu ?? el.M), 'Specify exactly one finite anomaly: nu or M.');
    require(['AU', 'km'].includes(el.units?.a) && el.units?.angles === 'deg', 'Keplerian units must specify a: AU or km, angles: deg.');
  }
  require(Array.isArray(doc.events), 'events must be an array.');
  doc.events.forEach((ev, index) => {
    const at = `events[${index}]`;
    require(ev && ['burn', 'oberthBurn', 'tetherRelease', 'hitchhike', 'gravityAssist', 'solarSail'].includes(ev.type), `${at}: unsupported event type.`);
    require(ev.id === undefined || (typeof ev.id === 'string' && ev.id.trim()), `${at}: id must be a nonempty string.`);
    if (ev.type === 'solarSail') {
      require(doc.centralBody === 'Sun' && number(ev.beta) && ev.beta >= 0 && ev.beta < 1, `${at}: solarSail needs Sun and 0 ≤ beta < 1.`);
      require(ev.location === undefined || ['current', 'perihelion', 'periapsis', 'aphelion', 'apoapsis'].includes(ev.location) || number(ev.location), `${at}: invalid sail location.`);
    } else if (ev.type === 'gravityAssist') {
      require(typeof ev.body === 'string' && ev.body.trim() && number(ev.periapsis_km) && ev.periapsis_km > 0
        && (ev.turnAngle_deg === undefined || (number(ev.turnAngle_deg) && ev.turnAngle_deg > 0 && ev.turnAngle_deg < 180)), `${at}: invalid gravity-assist parameters.`);
    } else {
      require(number(ev.deltaV_km_s) && ev.deltaV_km_s >= 0, `${at}: deltaV_km_s must be nonnegative.`);
      require(['prograde', 'retrograde', 'radial', 'normal'].includes(ev.direction), `${at}: invalid direction.`);
      if (ev.type === 'oberthBurn') {
        require(number(ev.perihelion_AU) && ev.perihelion_AU > 0, `${at}: perihelion_AU must be positive.`);
      }
    }
  });
  return doc;
}

// Solve Kepler's equation by bisection, including signed hyperbolic mean anomaly.
export function trueAnomalyFromMean(meanDegrees, eccentricity) {
  const rad = Math.PI / 180;
  let mean = meanDegrees * rad;
  const elliptic = eccentricity < 1;
  if (elliptic) mean = ((mean + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI;
  let hi = elliptic ? Math.PI : Math.max(1, Math.asinh(Math.abs(mean) / eccentricity) + 1);
  const equation = elliptic
    ? (x) => x - eccentricity * Math.sin(x)
    : (x) => eccentricity * Math.sinh(x) - x;
  while (equation(hi) < Math.abs(mean)) hi *= 2;
  let lo = 0;
  for (let j = 0; j < 80; j++) {
    const mid = (lo + hi) / 2;
    if (equation(mid) < Math.abs(mean)) lo = mid;
    else hi = mid;
  }
  const anomaly = Math.sign(mean) * (lo + hi) / 2;
  return (elliptic
    ? 2 * Math.atan2(Math.sqrt(1 + eccentricity) * Math.sin(anomaly / 2), Math.sqrt(1 - eccentricity) * Math.cos(anomaly / 2))
    : 2 * Math.atan(Math.sqrt((eccentricity + 1) / (eccentricity - 1)) * Math.tanh(anomaly / 2))) / rad;
}

export function engineElements(el, centralBody) {
  if (el.type === 'cartesian') {
    const r = el.r.map(x => x * (el.units.r === 'AU' ? AU_KM : 1));
    const k = stateToElements(r, el.v, MU[centralBody]);
    const degrees = 180 / Math.PI;
    return {
      type: 'keplerian', rp: k.rp / AU_KM, e: k.e,
      i: k.i * degrees, raan: k.raan * degrees, argp: k.argp * degrees, nu: k.nu * degrees,
      units: { a: 'AU', angles: 'deg' }
    };
  }
  return { ...el, nu: el.nu ?? trueAnomalyFromMean(el.M, el.e) };
}

export function buildTrajectory(doc, options = {}) {
  validateScenario(doc);
  const settings = { ephemerisSamples: 257, ephemerisMaxRadius_AU: 30, ...options, centralBody: doc.centralBody };
  let current = applyEvents(engineElements(doc.initialElements, doc.centralBody), [], settings);
  const legs = [current];
  const markers = [];
  const log = [];
  let totalDeltaV = 0;
  for (const [index, event] of doc.events.entries()) {
    // `radial` is the schema spelling for the engine's outward direction.
    const adapted = { ...event, direction: event.direction === 'radial' ? 'radialOut' : event.direction };
    current = applyEvents(current.finalElements, [adapted], { ...settings, sailBeta: current.sailBeta });
    const entry = { ...current.log[0], index };
    log.push(entry);
    totalDeltaV += current.totalDeltaV_km_s;
    legs.push(current);
    markers.push({ index, label: event.id ?? event.type, status: entry.status,
      position: current.finalState.r_km.map(x => x / AU_KM) });
  }
  for (const leg of legs) {
    if (leg.ephemerisPoints.some(point => !point.r_AU.every(Number.isFinite))) {
      throw new Error('The engine produced nonfinite ephemeris points. Check the initial state and events.');
    }
  }
  return { legs, markers, result: { ...current, log, totalDeltaV_km_s: totalDeltaV } };
}

export function speedText(vInf) {
  return vInf === null
    ? { speed: 'Bound orbit', percent: '— (no escape asymptote)' }
    : { speed: `${vInf.toFixed(3)} km/s`, percent: `${(100 * vInf / C_KM_S).toFixed(6)}% of c` };
}

export const SPEED_TARGET_KM_S = 300;

/** Initial state plus the actual post-event escape speeds, including skipped steps.
 * Keep null for bound orbits: they do not have an escape asymptote.
 */
export function buildSpeedSeries(model) {
  return model.legs.map((leg, index) => ({
    index,
    label: index === 0 ? 'Initial orbit' : model.markers[index - 1].label,
    status: index === 0 ? 'initial' : model.markers[index - 1].status,
    vInf_km_s: leg.vInf_km_s
  }));
}

/** Bound states have no escape speed and make no progress toward the target.
 * Report the real percentage above target, but clamp the visual progress bar.
 */
export function targetProgress(vInf, target_km_s = SPEED_TARGET_KM_S) {
  if (!Number.isFinite(target_km_s) || target_km_s <= 0) throw new Error('Speed target must be positive and finite.');
  if (vInf !== null && (!Number.isFinite(vInf) || vInf < 0)) throw new Error('Escape speed must be null or nonnegative and finite.');
  const speed = vInf ?? 0;
  const percentReached = 100 * speed / target_km_s;
  return {
    bound: vInf === null,
    gap_km_s: Math.max(0, target_km_s - speed),
    percentReached,
    progressPercent: Math.min(100, percentReached)
  };
}

// Time from periapsis in seconds. Angles here are radians, unlike schema angles.
function timeFromAnomaly(nu, k, mu) {
  if (!Number.isFinite(k.a)) {
    const d = Math.tan(nu / 2);
    return Math.sqrt(k.p ** 3 / mu) / 2 * (d + d ** 3 / 3); // Barker's equation
  }
  const n = Math.sqrt(mu / Math.abs(k.a) ** 3);
  if (k.e < 1) {
    const E = 2 * Math.atan2(Math.sqrt(1 - k.e) * Math.sin(nu / 2),
      Math.sqrt(1 + k.e) * Math.cos(nu / 2));
    return (E - k.e * Math.sin(E)) / n;
  }
  const H = 2 * Math.atanh(Math.sqrt((k.e - 1) / (k.e + 1)) * Math.tan(nu / 2));
  return (k.e * Math.sinh(H) - H) / n;
}

/** Preview complete conics in leg order, using their sampled endpoints as limits.
 * These are independent conic previews, not scheduled event-to-event transfers.
 * Ellipses cover one period; open legs cover the engine's radius-capped arc.
 */
export function buildPlayback(model) {
  let duration_s = 0;
  const legs = model.legs.map(leg => {
    const mu = leg.effectiveMu_km3_s2 ?? MU[leg.centralBody];
    const k = stateToElements(leg.finalState.r_km, leg.finalState.v_km_s, mu);
    const points = leg.ephemerisPoints;
    if (points.length < 2) throw new Error('Playback needs at least two ephemeris samples per leg.');
    const startNu = points[0].nu_deg * Math.PI / 180;
    const endNu = points.at(-1).nu_deg * Math.PI / 180;
    const periapsisStart_s = timeFromAnomaly(startNu, k, mu);
    const legDuration_s = timeFromAnomaly(endNu, k, mu) - periapsisStart_s;
    if (!Number.isFinite(legDuration_s) || legDuration_s < 0) throw new Error('Invalid conic playback duration.');
    const start_s = duration_s;
    duration_s += legDuration_s;
    return { k, mu, startNu, endNu, periapsisStart_s, start_s, duration_s: legDuration_s, end_s: duration_s };
  });
  if (!legs.length) throw new Error('Playback needs at least one leg.');
  return { legs, duration_s };
}

/** Exact two-body position at a clamped preview time; shared by both renderers. */
export function playbackAt(playback, time_s) {
  if (!Number.isFinite(time_s)) throw new Error('Playback time must be finite.');
  const elapsed_s = Math.max(0, Math.min(playback.duration_s, time_s));
  const index = playback.legs.findIndex((leg, i) => elapsed_s < leg.end_s || i === playback.legs.length - 1);
  const leg = playback.legs[index];
  const legTime_s = elapsed_s - leg.start_s;
  const t = leg.periapsisStart_s + legTime_s;
  let nu;
  // Preserve endpoints exactly, including the two representations of apoapsis.
  if (legTime_s <= 0) nu = leg.startNu;
  else if (elapsed_s >= leg.end_s) nu = leg.endNu;
  else if (!Number.isFinite(leg.k.a)) {
    const b = 2 * t / Math.sqrt(leg.k.p ** 3 / leg.mu);
    const d = 2 * Math.sinh(Math.asinh(1.5 * b) / 3);
    nu = 2 * Math.atan(d);
  } else {
    const mean = t * Math.sqrt(leg.mu / Math.abs(leg.k.a) ** 3);
    nu = trueAnomalyFromMean(mean * 180 / Math.PI, leg.k.e) * Math.PI / 180;
  }
  const state = elementsToState({ ...leg.k, nu }, leg.mu);
  return { index, elapsed_s, legTime_s, position: state.r.map(x => x / AU_KM) };
}
