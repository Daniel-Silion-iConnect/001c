import { buildSpeedSeries, targetProgress, targetProgressText, speedText, SPEED_TARGET_KM_S } from './viewer-data.js';
import { createDisclosureCard } from './disclosure-card.js';

// A shadow root keeps this sidebar panel independent of the viewer's layout/theme.
export function createSpeedPanel(model, onSelect) {
  const card = createDisclosureCard('Speed after each step · v∞ (km/s)', 'speed-card');
  const element = document.createElement('section');
  element.setAttribute('aria-label', 'Speed accumulation');
  const root = element.attachShadow({ mode: 'open' });
  root.innerHTML = `
    <style>
      :host { display: block; font: inherit; }
      p, ol { font-size: 12px; margin: 8px 0; }
      .muted { color: #9fb0c5; }
      .chart { overflow-x: auto; }
      svg { display: block; width: 100%; height: auto; }
      svg text { fill: #9fb0c5; font: 11px system-ui, sans-serif; }
      .axis { stroke: #3d5068; }
      .gain { stroke: #6de2b4; }
      .skipped { stroke: #8b96a5; stroke-dasharray: 4 3; }
      circle { stroke: #6de2b4; fill: #6de2b4; stroke-width: 2; }
      circle.bound { fill: #0d1726; }
      circle.skipped { stroke: #8b96a5; fill: #8b96a5; stroke-dasharray: none; }
      circle.skipped.bound { fill: #0d1726; }
      circle.selected { stroke: #fff; stroke-width: 3; }
      ol { list-style: none; padding: 0; }
      li { margin: 3px 0; }
      button { width: 100%; text-align: left; font: inherit; color: inherit;
        background: transparent; border: 1px solid transparent; border-radius: 4px;
        padding: 3px 5px; cursor: pointer; overflow-wrap: anywhere; }
      button.skipped { color: #8b96a5; }
      button[aria-pressed="true"] { border-color: #6de2b4; }
      button:focus-visible { outline: 2px solid #6de2b4; outline-offset: 2px; }
    </style>
    <div class="chart"></div>
    <p class="muted">Hollow points mark bound orbits with no escape asymptote. Steps are in event order.</p>
    <ol aria-label="Speed by step"></ol>
  `;
  card.content.append(element);
  const progressElement = document.createElement('section');
  progressElement.setAttribute('aria-label', 'Progress toward 300 km/s');
  progressElement.innerHTML = `
    <h2>Target · ${SPEED_TARGET_KM_S} km/s (≈0.1% c)</h2>
    <p id="gap"></p>
    <progress max="100" value="0" aria-label="Progress toward 300 km/s target" aria-describedby="gap"></progress>
  `;
  const series = buildSpeedSeries(model);
  const width = Math.max(300, 82 + (series.length - 1) * 44);
  const height = 166, left = 69, right = width - 14, top = 20, bottom = 138;
  const maxSpeed = Math.max(1, ...series.map(step => step.vInf_km_s ?? 0));
  const x = index => left + index * (right - left) / Math.max(1, series.length - 1);
  const y = speed => bottom - (speed ?? 0) / maxSpeed * (bottom - top);
  const svgNode = (name, attributes = {}, text) => {
    const node = document.createElementNS('http://www.w3.org/2000/svg', name);
    for (const [key, value] of Object.entries(attributes)) node.setAttribute(key, value);
    if (text !== undefined) node.textContent = text;
    return node;
  };
  const svg = svgNode('svg', { viewBox: `0 0 ${width} ${height}`, role: 'img', 'aria-label': 'Escape speed after each step; values and labels follow below.' });
  svg.style.minWidth = `${width}px`;
  svg.append(svgNode('path', { d: `M${left},${top}V${bottom}H${right}`, class: 'axis', fill: 'none' }));
  for (const value of [0, maxSpeed]) svg.append(svgNode('text', { x: left - 6, y: y(value) + 4, 'text-anchor': 'end' }, value.toLocaleString('en-US', { maximumFractionDigits: 1 })));
  const points = [], buttons = [];
  series.forEach((step, index) => {
    const skipped = step.status === 'skipped';
    const speed = step.vInf_km_s === null ? 'Bound orbit' : `${speedText(step.vInf_km_s).speed} · ${speedText(step.vInf_km_s).percent}`;
    const label = `${index} · ${step.label}: ${speed}${skipped ? ' (skipped)' : ''}`;
    const previous = series[index - 1];
    // Bound values are absent, not zero: don't draw a numerical line through them.
    if (previous && previous.vInf_km_s !== null && step.vInf_km_s !== null) {
      svg.append(svgNode('line', { x1: x(index - 1), y1: y(previous.vInf_km_s), x2: x(index), y2: y(step.vInf_km_s), class: skipped ? 'skipped' : 'gain', 'stroke-width': 2 }));
    }
    const point = svgNode('circle', { cx: x(index), cy: y(step.vInf_km_s), r: 4,
      class: [skipped ? 'skipped' : '', step.vInf_km_s === null ? 'bound' : ''].join(' ') });
    point.append(svgNode('title', {}, label));
    svg.append(point, svgNode('text', { x: x(index), y: bottom + 20, 'text-anchor': 'middle' }, index));
    points.push(point);
    const item = document.createElement('li');
    const button = document.createElement('button');
    button.type = 'button'; button.textContent = label;
    button.classList.toggle('skipped', skipped);
    button.addEventListener('click', () => onSelect(index));
    item.append(button); root.querySelector('ol').append(item); buttons.push(button);
  });
  root.querySelector('.chart').append(svg);
  return {
    element: card.element,
    progressElement,
    select(index) {
      const step = series[index];
      const progress = targetProgress(step.vInf_km_s);
      progressElement.querySelector('#gap').textContent = `Step ${index} · ${targetProgressText(step.vInf_km_s)}`;
      progressElement.querySelector('progress').value = progress.progressPercent;
      points.forEach((point, i) => point.classList.toggle('selected', i === index));
      buttons.forEach((button, i) => button.setAttribute('aria-pressed', String(i === index)));
    }
  };
}
