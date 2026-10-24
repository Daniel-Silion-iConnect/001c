// Browser/Node helpers. The viewer adapts schema inputs without changing the engine.
import { AU_KM, C_KM_S, MU, applyEvents, stateToElements } from './engine.js';

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
    require(ev && ['burn', 'oberthBurn', 'tetherRelease', 'hitchhike', 'gravityAssist'].includes(ev.type), `${at}: unsupported event type.`);
    require(ev.id === undefined || (typeof ev.id === 'string' && ev.id.trim()), `${at}: id must be a nonempty string.`);
    if (ev.type === 'gravityAssist') {
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
    current = applyEvents(current.finalElements, [adapted], settings);
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
