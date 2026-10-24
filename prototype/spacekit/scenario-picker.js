// The index is ordered by engine-computed final v∞ descending (checked in tests).
// Its first entry supplies the default for both the picker and the viewer.
export const SCENARIO_INDEX = 'scenarios/index.json';

/** Picker options ({ id, value, label, title }) in index order. */
export function pickerOptions(index) {
  if (!Array.isArray(index)) throw new Error(`${SCENARIO_INDEX} must be an array.`);
  return index.map(entry => ({
    id: entry.id, value: `scenarios/${entry.file}`,
    label: entry.category === 'exotic' ? `Exotic · speculative — ${entry.name}` : entry.name,
    title: entry.category === 'exotic'
      ? `${entry.summary ?? ''} Feasibility: ${entry.feasibility} Showstopper: ${entry.showstopper}`
      : entry.summary ?? '',
    category: entry.category, feasibility: entry.feasibility, showstopper: entry.showstopper
  }));
}

// Match resolved URLs so explicit ./paths and absolute reference URLs work too.
export function scenarioIdForPath(options, path, baseURL) {
  const url = new URL(path, baseURL).href;
  return options.find(option => new URL(option.value, baseURL).href === url)?.id;
}

export function selectScenario(options, search) {
  const current = new URLSearchParams(search).get('scenario') || options[0]?.value;
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
    metadata.hidden = selected?.category !== 'exotic';
    metadata.textContent = metadata.hidden ? ''
      : `Exotic · speculative. Feasibility: ${selected.feasibility} Showstopper: ${selected.showstopper}`;
  };
  renderMetadata();
  select.addEventListener('change', () => {
    renderMetadata();
    input.value = select.value;
    input.form.requestSubmit();
  });
  return { path: current, id: scenarioIdForPath(options, current, location.href) };
}
