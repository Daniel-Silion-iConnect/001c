import { buildTravelTimeRows, formatTravelYears, CRUISE_TARGET_KM_S } from './viewer-data.js';
import { createDisclosureCard } from './disclosure-card.js';

// Uses the loaded scenario's final result, independent of the inspected leg.
export function createTravelTimePanel(vInf_km_s) {
  const panel = document.createElement('section');
  panel.id = 'travel-time';
  panel.setAttribute('aria-labelledby', 'travel-time-title');
  panel.innerHTML = `
    <h2 id="travel-time-title">Travel time</h2>
    <p class="muted travel-speed"></p>
    <div class="travel-highlights" aria-label="Cruise travel highlights"></div>
    <p id="travel-time-note" class="muted">Distance ÷ final v∞ only. Ignores time spent leaving the Sun’s gravity; no acceleration or braking. — means a bound orbit or zero escape speed. Distances are approximate; stars are held fixed.</p>
  `;
  const card = createDisclosureCard('All travel times', 'travel-card');
  card.content.innerHTML = `
    <table aria-describedby="travel-time-note">
      <caption>Cruise estimates in years (yr)</caption>
      <thead><tr><th scope="col">Milestone</th><th scope="col">Scenario</th><th scope="col">0.001c</th></tr></thead>
      <tbody></tbody>
    </table>
  `;
  panel.append(card.element);
  panel.querySelector('.travel-speed').textContent = `Final v∞: ${vInf_km_s === null ? 'bound orbit' : `${vInf_km_s.toFixed(3)} km/s`} · target: ${CRUISE_TARGET_KM_S.toFixed(2)} km/s`;
  const body = panel.querySelector('tbody');
  const rows = buildTravelTimeRows(vInf_km_s);
  for (const row of rows.filter(row => row.name.includes('Proxima') || row.name === 'Heliopause').reverse()) {
    const highlight = document.createElement('section');
    const heading = document.createElement('h3');
    heading.textContent = row.name.includes('Proxima') ? 'Proxima Centauri' : row.name;
    const comparison = document.createElement('p');
    const scenario = document.createElement('strong');
    scenario.textContent = formatTravelYears(row.years);
    comparison.append(scenario, ` scenario · ${formatTravelYears(row.targetYears)} at 0.001c`);
    highlight.append(heading, comparison);
    panel.querySelector('.travel-highlights').append(highlight);
  }
  for (const row of rows) {
    const tr = document.createElement('tr');
    const name = document.createElement('th');
    name.scope = 'row'; name.textContent = row.name;
    const distance = document.createElement('span');
    distance.className = 'milestone-distance';
    distance.textContent = `≈${row.distance.toLocaleString('en-US')} ${row.unit}`;
    name.append(distance); tr.append(name);
    for (const years of [row.years, row.targetYears]) {
      const td = document.createElement('td');
      td.textContent = formatTravelYears(years); tr.append(td);
    }
    body.append(tr);
  }
  return panel;
}
