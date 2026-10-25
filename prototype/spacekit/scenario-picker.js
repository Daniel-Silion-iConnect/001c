// The index is ordered by engine-computed final v∞ descending (checked in tests).
// An explicit default keeps the kilogram-class Concept F selected even when
// gram-scale comparisons are faster. Unmarked/custom indexes use their first entry.
import { cruiseYears, formatTravelYears, LIGHT_YEAR_KM } from './viewer-data.js';
export const SCENARIO_INDEX = 'scenarios/index.json';

/** Picker options ({ id, value, label, title }) in index order. */
export function pickerOptions(index) {
  if (!Array.isArray(index)) throw new Error(`${SCENARIO_INDEX} must be an array.`);
  return index.map(entry => {
    const years = entry.arrival?.years ?? cruiseYears(4.24 * LIGHT_YEAR_KM, entry.cruiseSpeed_km_s);
    const classification = entry.category === 'exotic' ? ' · Exotic · speculative' : '';
    const scope = entry.beyondTarget ? ` · Beyond-target · ${entry.massClass}` : '';
    const trip = entry.arrival
      ? `${entry.arrival.destination}: ~${formatTravelYears(years)} · ${entry.arrival.mode}.`
      : `Proxima: ~${formatTravelYears(years)} (distance ÷ final v∞; no braking).`;
    return {
      id: entry.id, value: `scenarios/${entry.file}`,
      label: `~${formatTravelYears(years)} · ${entry.pickerName ?? entry.name}${classification}${scope}`,
      title: `${entry.name}. ${trip} ${entry.arrival?.note ?? ''} ${entry.category === 'exotic'
        ? `${entry.summary ?? ''} Feasibility: ${entry.feasibility} Showstopper: ${entry.showstopper}`
        : entry.summary ?? ''}`,
      default: entry.default, arrival: entry.arrival, trip,
      beyondTarget: entry.beyondTarget, massClass: entry.massClass,
      summary: entry.summary,
      category: entry.category, feasibility: entry.feasibility, showstopper: entry.showstopper
    };
  });
}

// Match resolved URLs so explicit ./paths and absolute reference URLs work too.
export function scenarioIdForPath(options, path, baseURL) {
  const url = new URL(path, baseURL).href;
  return options.find(option => new URL(option.value, baseURL).href === url)?.id;
}

export function selectScenario(options, search) {
  const current = new URLSearchParams(search).get('scenario')
    || options.find(option => option.default)?.value || options[0]?.value;
  if (!current) throw new Error('No reference scenarios available. Enter a Scenario JSON path.');
  return current;
}

export async function mountPicker() {
  const select = document.getElementById('picker');
  const input = document.getElementById('scenario');
  let options = [];
  try {
    const response = await fetch(SCENARIO_INDEX);
    if (response.ok) options = pickerOptions(await response.json());
  } catch { /* Explicit custom paths remain usable when the index is unavailable. */ }
  const current = selectScenario(options, location.search);
  if (!options.some(option => option.value === current)) {
    options.push({ value: current, label: `Custom: ${current}`, title: current });
  }
  for (const { value, label, title } of options) {
    const option = document.createElement('option');
    option.value = value; option.textContent = label; option.title = title;
    select.append(option);
  }
  select.value = current;
  input.value = current;
  const metadata = document.getElementById('picker-feasibility');
  const renderMetadata = () => {
    const selected = options.find(option => option.value === select.value);
    document.getElementById('picker-trip').textContent = selected?.trip ?? '';
    metadata.hidden = selected?.category !== 'exotic';
    metadata.textContent = metadata.hidden ? ''
      : `Exotic · speculative.${selected.beyondTarget ? ` Beyond-target · ${selected.massClass}.` : ''} Feasibility: ${selected.feasibility} Showstopper: ${selected.showstopper}`;
  };
  renderMetadata();
  select.addEventListener('change', () => {
    renderMetadata();
    input.value = select.value;
    input.form.requestSubmit();
  });
  const id = scenarioIdForPath(options, current, location.href);
  const selected = options.find(option => option.id === id);
  return { path: current, id, summary: selected?.summary, arrival: selected?.arrival };
}
