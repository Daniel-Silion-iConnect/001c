// Scenario picker: lists schema-example.json plus scenarios/index.json and reloads the
// viewer with ?scenario=<path>. Kept separate from viewer.js, which owns loading/HUD.
export const DEFAULT_SCENARIO = 'schema-example.json';
export const SCENARIO_INDEX = 'scenarios/index.json';

/** Picker options ({ value, label, title }) for an index.json array; the default comes first. */
export function pickerOptions(index) {
  if (!Array.isArray(index)) throw new Error(`${SCENARIO_INDEX} must be an array.`);
  return [
    { value: DEFAULT_SCENARIO, label: 'Sample trajectory (schema example)', title: 'Event vocabulary example' },
    ...index.map(entry => ({ value: `scenarios/${entry.file}`, label: entry.name, title: entry.summary ?? '' }))
  ];
}

async function mountPicker() {
  const select = document.getElementById('picker');
  const input = document.getElementById('scenario');
  if (!select || !input) return;
  const current = new URLSearchParams(location.search).get('scenario') || DEFAULT_SCENARIO;
  let options = pickerOptions([]);
  try {
    const response = await fetch(SCENARIO_INDEX);
    if (response.ok) options = pickerOptions(await response.json());
  } catch { /* Offline or file:// — keep the default entry only. */ }
  if (!options.some(option => option.value === current)) {
    options.push({ value: current, label: `Custom: ${current}`, title: current });
  }
  for (const { value, label, title } of options) {
    const option = document.createElement('option');
    option.value = value; option.textContent = label; option.title = title;
    select.append(option);
  }
  select.value = current;
  select.addEventListener('change', () => {
    input.value = select.value;
    input.form.requestSubmit();
  });
}

if (typeof document !== 'undefined') mountPicker();
