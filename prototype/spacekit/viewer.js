import { buildTrajectory, buildPlayback, playbackAt, speedText } from './viewer-data.js';
import { canvasView, threeView, legColor } from './renderers.js';
import { createSpeedPanel } from './speed-panel.js';

const element = (id) => document.getElementById(id);
const scenario = new URLSearchParams(location.search).get('scenario') || 'schema-example.json';
element('scenario').value = scenario;

async function start() {
  const response = await fetch(scenario);
  if (!response.ok) throw new Error(`Cannot load ${scenario}: HTTP ${response.status}.`);
  let doc;
  try { doc = await response.json(); }
  catch { throw new Error(`Cannot parse ${scenario}: expected valid JSON.`); }
  const model = buildTrajectory(doc);
  const playback = buildPlayback(model);
  const title = doc.name || 'Untitled trajectory';
  element('title').textContent = title;
  document.title = `001c — ${title}`;
  element('status').textContent = `${doc.centralBody} · ${doc.frame} · ${doc.epoch}`;
  element('summary').textContent = `${model.result.totalDeltaV_km_s.toFixed(3)} km/s total modeled Δv · ${model.result.log.filter(e => e.status === 'skipped').length} skipped events`;
  const labels = [];
  const eventButtons = [];
  let selected = -1;
  let current = playbackAt(playback, 0);
  let playing = false;
  let previousFrame;
  let view;
  const inspect = (index) => {
    selected = index;
    element('leg').value = String(index);
    const leg = model.legs[index];
    const text = speedText(leg.vInf_km_s);
    element('speed').textContent = text.speed;
    element('percent').textContent = text.percent;
    element('context').textContent = `Leg ${index} · ${leg.bound ? 'elliptic orbit' : leg.finalElements.e > 1 ? 'hyperbolic path' : 'parabolic path'} · e = ${leg.finalElements.e.toFixed(4)}`;
    speedPanel.select(index);
    eventButtons.forEach((button, i) => button.setAttribute('aria-pressed', String(i + 1 === index)));
    labels.forEach((button, i) => button.setAttribute('aria-pressed', String(i + 1 === index)));
    view?.select(index);
  };
  const days = seconds => `${(seconds / 86400).toFixed(3)} d`;
  const seek = (time_s) => {
    current = playbackAt(playback, time_s);
    if (selected !== current.index) inspect(current.index);
    view?.setProbe(current.position);
    element('time').value = String(current.elapsed_s);
    element('time').setAttribute('aria-valuetext', `Leg ${current.index}, ${days(current.legTime_s)}; preview ${days(current.elapsed_s)}`);
    element('playback-time').textContent = `Preview ${days(current.elapsed_s)} / ${days(playback.duration_s)} · Leg ${current.index}: ${days(current.legTime_s)} / ${days(playback.legs[current.index].duration_s)}`;
  };
  const setPlaying = value => {
    playing = value;
    previousFrame = undefined;
    element('play').textContent = value ? 'Pause' : current.elapsed_s >= playback.duration_s ? 'Replay' : 'Play';
    element('play').setAttribute('aria-pressed', String(value));
  };
  const select = index => { seek(playback.legs[index].start_s); setPlaying(playing); };
  const speedPanel = createSpeedPanel(model, select);
  element('context').after(speedPanel.element);
  element('time').max = String(playback.duration_s);
  element('time').disabled = element('play').disabled = playback.duration_s === 0;
  element('time').addEventListener('input', event => {
    seek(Number(event.target.value));
    setPlaying(false);
  });
  element('play').addEventListener('click', () => {
    if (!playing && current.elapsed_s >= playback.duration_s) seek(0);
    setPlaying(!playing);
  });
  // One minute of wall time previews the full timeline, at a constant time scale.
  const frame = timestamp => {
    if (playing && !document.hidden && previousFrame !== undefined) {
      seek(current.elapsed_s + (timestamp - previousFrame) / 1000 * playback.duration_s / 60);
      if (current.elapsed_s >= playback.duration_s) setPlaying(false);
    }
    previousFrame = document.hidden ? undefined : timestamp;
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
  model.legs.forEach((_, index) => {
    const option = document.createElement('option'); option.value = String(index);
    option.textContent = index === 0 ? '0 · Initial orbit' : `${index} · After ${model.markers[index - 1].label}`;
    element('leg').append(option);
  });
  element('leg').addEventListener('change', event => select(Number(event.target.value)));
  model.markers.forEach((marker, index) => {
    const item = document.createElement('li');
    const button = document.createElement('button'); button.type = 'button';
    button.textContent = `${index + 1}. ${marker.label}${marker.status === 'skipped' ? ' (skipped)' : ''}`;
    button.style.setProperty('--leg-color', legColor(index + 1));
    button.addEventListener('click', () => select(index + 1));
    item.append(button); element('events').append(item); eventButtons.push(button);
    const label = document.createElement('button'); label.type = 'button'; label.textContent = String(index + 1);
    label.title = button.textContent; label.setAttribute('aria-label', button.textContent);
    label.style.borderColor = legColor(index + 1);
    label.addEventListener('click', () => select(index + 1));
    element('markers').append(label); labels.push(label);
  });
  if (!model.markers.length) element('events').textContent = 'No events. Showing the initial orbit.';
  const notes = [];
  model.result.log.forEach(entry => {
    notes.push(...entry.warnings.map(warning => `${entry.id ?? entry.type}: ${warning}`));
    if (entry.perihelionAdjust) notes.push(`${entry.id ?? entry.type}: engine includes a perihelion-retargeting burn; the intermediate transfer conic is not shown.`);
  });
  for (const note of notes.length ? notes : ['No engine warnings.']) {
    const li = document.createElement('li'); li.textContent = note; element('warnings').append(li);
  }
  element('hud').hidden = false;
  const fallback = (reason) => {
    view?.dispose();
    view = canvasView(element('plot'), model, labels, doc.centralBody);
    view.select(selected);
    view.setProbe(current.position);
    element('view-note').textContent = `2D oblique projection · ${reason}`;
    element('viewport').dataset.renderer = 'canvas';
  };
  inspect(current.index);
  fallback('Loading interactive 3D…'); seek(0);
  // Start in canvas immediately. A hanging CDN cannot prevent a usable viewer.
  let timeout;
  try {
    const [THREE, { OrbitControls }] = await Promise.race([
      Promise.all([import('three'), import('three/addons/controls/OrbitControls.js')]),
      new Promise((_, reject) => { timeout = setTimeout(() => reject(new Error('CDN timed out')), 6000); })
    ]);
    view.dispose(); view = null;
    view = threeView(element('plot'), model, labels, doc.centralBody, THREE, OrbitControls,
      () => fallback('WebGL context lost.'));
    view.select(selected);
    view.setProbe(current.position);
    element('view-note').textContent = `${doc.centralBody} at origin · Drag to rotate · Scroll to zoom · Numbered markers select events`;
    element('viewport').dataset.renderer = 'three';
  } catch {
    fallback('3D unavailable (CDN or WebGL). Numbered markers select events.');
  } finally { clearTimeout(timeout); }
}

start().catch(error => {
  element('status').classList.add('error');
  element('status').textContent = `${error.message} Serve this directory over HTTP (for example: npx serve prototype/spacekit).`;
  element('view-note').textContent = 'Scenario could not be loaded. Check the file path and trajectory fields.';
});
