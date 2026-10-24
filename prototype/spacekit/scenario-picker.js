// The index is ordered by engine-computed final v∞ descending (checked in tests).
// Its first entry supplies the default for both the picker and the viewer.
export const SCENARIO_INDEX = 'scenarios/index.json';

/** Picker options ({ value, label, title }) in index order. */
export function pickerOptions(index) {
  if (!Array.isArray(index)) throw new Error(`${SCENARIO_INDEX} must be an array.`);
  return index.map(entry => ({ value: `scenarios/${entry.file}`, label: entry.name, title: entry.summary ?? '' }));
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
  select.addEventListener('change', () => {
    input.value = select.value;
    input.form.requestSubmit();
  });
  return current;
}
