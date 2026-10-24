const text = value => typeof value === 'string' ? value.trim() : '';
const entry = (record, key) => record && Object.hasOwn(record, key) ? text(record[key]) : '';

// Narrative data is optional: a failed request must not delay or stop the viewer.
export async function loadNarratives(fetchJSON = fetch) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 4000);
  try {
    const response = await fetchJSON('narratives.json', { signal: controller.signal });
    if (!response.ok) return {};
    const data = await response.json();
    return data && typeof data === 'object' && !Array.isArray(data) ? data : {};
  } catch {
    return {};
  } finally {
    clearTimeout(timeout);
  }
}

// Leg 0 is the initial orbit; leg n describes the event at events[n - 1].
export function narrativeText(data, scenarioId, doc, index, status) {
  const intro = text(data?.intro) || 'Project 001c explores ways to accelerate a small probe to 0.001c (about 300 km/s).';
  const scenario = entry(data?.scenarios, scenarioId) || text(doc.description) || 'No narrative is available for this scenario. Inspect its legs and engine notes below.';
  const event = index > 0 ? doc.events?.[index - 1] : undefined;
  if (!event) return {
    intro, scenario, eventTitle: 'Leg 0 · Initial orbit',
    event: 'The probe starts on this orbit before any modeled events. Select an event or play the preview to follow the mission.'
  };
  const paragraphs = [entry(data?.eventTypes, event.type) || 'No explanation is available for this event type. See the event parameters and engine notes.'];
  // STP is propulsion context for this Oberth event, not a new schema event type.
  if (event.type === 'oberthBurn' && event.id === 'stp-oberth') {
    const stp = entry(data?.eventTypes, 'stp');
    if (stp) paragraphs.push(stp);
  }
  if (status === 'skipped') paragraphs.unshift('This event was skipped by the engine. The explanation describes the intended maneuver, not an applied speed change.');
  return { intro, scenario, eventTitle: `Leg ${index} · ${event.id || event.type}`, event: paragraphs.join('\n\n') };
}

export function createNarrativePanel(doc, scenarioId, shortDescription) {
  const element = document.createElement('section');
  element.id = 'narrative';
  element.setAttribute('aria-labelledby', 'narrative-title');
  element.innerHTML = `
    <h2 id="narrative-title">Mission story</h2>
    <p class="narrative-short"></p>
    <div class="narrative-current" aria-live="polite" aria-atomic="true">
      <h3 class="narrative-event-title"></h3>
      <p class="narrative-event"></p>
    </div>
  `;
  const detailsElement = document.createElement('section');
  detailsElement.innerHTML = `
    <h2>Project context</h2><p class="narrative-intro"></p>
    <h2>Full scenario story</h2><p class="narrative-scenario"></p>
  `;
  let data = {}, index = 0, status;
  const render = () => {
    const copy = narrativeText(data, scenarioId, doc, index, status);
    for (const [selector, value] of [
      ['.narrative-intro', copy.intro], ['.narrative-scenario', copy.scenario],
      ['.narrative-event-title', copy.eventTitle], ['.narrative-event', copy.event]
    ]) {
      const node = element.querySelector(selector) || detailsElement.querySelector(selector);
      if (node.textContent !== value) node.textContent = value;
    }
    element.querySelector('.narrative-short').textContent = text(shortDescription) || copy.scenario;
  };
  render();
  return {
    element,
    detailsElement,
    setData(value) { data = value; render(); },
    select(value, eventStatus) { index = value; status = eventStatus; render(); }
  };
}
