import { buildTravelTimeRows, formatTravelYears, CRUISE_TARGET_KM_S } from './viewer-data.js';

// Uses the loaded scenario's final result, independent of the inspected leg.
export function createTravelTimePanel(vInf_km_s) {
  const panel = document.createElement('section');
  panel.id = 'travel-time';
  panel.setAttribute('aria-labelledby', 'travel-time-title');
  panel.innerHTML = `
    <h2 id="travel-time-title">Travel time</h2>
    <p class="muted travel-speed"></p>
    <table aria-describedby="travel-time-note">
      <caption>Cruise estimates in years (yr)</caption>
      <thead><tr><th scope="col">Milestone</th><th scope="col">Scenario</th><th scope="col">0.001c</th></tr></thead>
      <tbody></tbody>
    </table>
    <p id="travel-time-note" class="muted">Distance ÷ final v∞ only. Ignores time spent leaving the Sun’s gravity; no acceleration or braking. — means a bound orbit or zero escape speed. Distances are approximate; stars are held fixed.</p>
  `;
  panel.querySelector('.travel-speed').textContent = `Final v∞: ${vInf_km_s === null ? 'bound orbit' : `${vInf_km_s.toFixed(3)} km/s`} · target: ${CRUISE_TARGET_KM_S.toFixed(2)} km/s`;
  const body = panel.querySelector('tbody');
  for (const row of buildTravelTimeRows(vInf_km_s)) {
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
