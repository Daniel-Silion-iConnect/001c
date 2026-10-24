const COLORS = ['#8498b0', '#6de2b4', '#f5b96b', '#91adff', '#e6a1e8', '#6ed4e3'];
export const legColor = (index) => COLORS[index % COLORS.length];

export function canvasView(host, model, labels, centralBody) {
  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-label', 'Sampled orbit legs, oblique 2D projection in AU');
  host.replaceChildren(canvas);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('This browser cannot create a 2D canvas.');
  let selected = model.legs.length - 1;
  let probePosition = null;
  // An oblique projection keeps out-of-plane legs visible in the fallback.
  const project = ([x, y, z]) => [x + 0.35 * z, y + 0.2 * z];
  const bounds = [0, 0, 0, 0];
  const positions = model.legs.flatMap(leg => leg.ephemerisPoints.map(p => p.r_AU));
  positions.push(...model.markers.map(marker => marker.position));
  for (const position of positions) {
    const [x, y] = project(position);
    bounds[0] = Math.min(bounds[0], x); bounds[1] = Math.max(bounds[1], x);
    bounds[2] = Math.min(bounds[2], y); bounds[3] = Math.max(bounds[3], y);
  }
  const draw = () => {
    const width = host.clientWidth, height = host.clientHeight;
    if (!width || !height) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = width * dpr; canvas.height = height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#080f1b'; ctx.fillRect(0, 0, width, height);
    const scale = Math.min(width * 0.78 / Math.max(bounds[1] - bounds[0], 1e-12),
      height * 0.74 / Math.max(bounds[3] - bounds[2], 1e-12));
    const screen = (position) => {
      const [x, y] = project(position);
      return [width / 2 + (x - (bounds[0] + bounds[1]) / 2) * scale,
        height / 2 - (y - (bounds[2] + bounds[3]) / 2) * scale];
    };
    // Draw the selected leg last so unchanged/skipped legs cannot cover it.
    const order = model.legs.map((_, i) => i).filter(i => i !== selected).concat(selected);
    for (const index of order) {
      const leg = model.legs[index];
      ctx.beginPath();
      leg.ephemerisPoints.forEach((p, j) => {
        const [x, y] = screen(p.r_AU);
        if (j === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      });
      if (leg.bound) ctx.closePath();
      ctx.strokeStyle = legColor(index); ctx.globalAlpha = index === selected ? 1 : 0.4;
      ctx.lineWidth = index === selected ? 2.5 : 1.2; ctx.stroke();
    }
    ctx.globalAlpha = 1;
    const [sx, sy] = screen([0, 0, 0]);
    ctx.fillStyle = '#ffd68a'; ctx.beginPath(); ctx.arc(sx, sy, 5, 0, Math.PI * 2); ctx.fill();
    ctx.font = '12px system-ui'; ctx.fillText(centralBody, sx + 10, sy - 8);
    model.markers.forEach((marker, index) => {
      const [x, y] = screen(marker.position);
      ctx.fillStyle = legColor(index + 1); ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI * 2); ctx.fill();
      labels[index].style.left = `${x + 14 + index * 22}px`;
      labels[index].style.top = `${y - 16}px`;
      labels[index].hidden = false;
    });
    if (probePosition) {
      const [x, y] = screen(probePosition);
      ctx.fillStyle = '#ffffff'; ctx.strokeStyle = '#080f1b'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(x, y, 6, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillText('Probe', x + 10, y + 16);
    }
    const barAU = 10 ** Math.floor(Math.log10(width * 0.15 / scale));
    ctx.strokeStyle = '#9fb0c5'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(20, 28); ctx.lineTo(20 + barAU * scale, 28); ctx.stroke();
    ctx.fillStyle = '#9fb0c5'; ctx.fillText(`${barAU.toPrecision(2)} AU`, 20, 20);
  };
  const observer = new ResizeObserver(draw); observer.observe(host); draw();
  return {
    select(index) { selected = index; draw(); },
    setProbe(position) { probePosition = position; draw(); },
    dispose() { observer.disconnect(); canvas.remove(); }
  };
}

export function threeView(host, model, labels, centralBody, THREE, OrbitControls, onContextLost) {
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  const scene = new THREE.Scene(); scene.background = new THREE.Color('#080f1b');
  const camera = new THREE.PerspectiveCamera(45, 1, 0.0001, 10000); camera.up.set(0, 0, 1);
  const controls = new OrbitControls(camera, renderer.domElement);
  let radius = 0;
  const lines = model.legs.map((leg, index) => {
    const points = leg.ephemerisPoints.map(p => {
      radius = Math.max(radius, Math.hypot(...p.r_AU));
      return new THREE.Vector3(...p.r_AU);
    });
    // Close elliptic orbits only; open conics must stay polylines.
    if (leg.bound) points.pop();
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({ color: legColor(index), transparent: true, opacity: 0.4, depthTest: false });
    const line = leg.bound ? new THREE.LineLoop(geometry, material) : new THREE.Line(geometry, material);
    scene.add(line); return line;
  });
  for (const marker of model.markers) radius = Math.max(radius, Math.hypot(...marker.position));
  radius = Math.max(radius, 1e-8);
  camera.near = radius / 10000; camera.far = radius * 1000;
  controls.minDistance = radius / 1000; controls.maxDistance = radius * 100;
  const geometry = new THREE.SphereGeometry(radius / 180, 12, 8);
  const body = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ color: '#ffd68a' }));
  body.name = centralBody; scene.add(body);
  const dots = model.markers.map((marker, i) => {
    const dot = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ color: legColor(i + 1) }));
    dot.position.set(...marker.position); scene.add(dot); return dot;
  });
  // A screen-sized point stays visible at every camera zoom level.
  const probeGeometry = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3()]);
  const probe = new THREE.Points(probeGeometry, new THREE.PointsMaterial({
    color: '#ffffff', size: 12, sizeAttenuation: false, depthTest: false
  }));
  probe.visible = false; probe.renderOrder = 2; scene.add(probe);
  host.replaceChildren(renderer.domElement);
  renderer.domElement.setAttribute('aria-label', `3D orbit legs around ${centralBody}, coordinates in AU`);
  renderer.domElement.addEventListener('webglcontextlost', (event) => { event.preventDefault(); onContextLost(); }, { once: true });
  let fitted = false;
  const resize = () => {
    const width = Math.max(1, host.clientWidth), height = Math.max(1, host.clientHeight);
    renderer.setSize(width, height); camera.aspect = width / height;
    if (!fitted) {
      camera.position.set(0, -0.65, 1).normalize().multiplyScalar(radius * 3.2 / Math.min(1, camera.aspect));
      fitted = true;
    }
    camera.updateProjectionMatrix(); controls.update();
  };
  const observer = new ResizeObserver(resize); observer.observe(host); resize();
  const projection = new THREE.Vector3();
  renderer.setAnimationLoop(() => {
    controls.update(); renderer.render(scene, camera);
    dots.forEach((dot, index) => {
      projection.copy(dot.position).project(camera);
      labels[index].hidden = Math.abs(projection.x) > 1 || Math.abs(projection.y) > 1 || Math.abs(projection.z) > 1;
      labels[index].style.left = `${(projection.x + 1) * host.clientWidth / 2 + 14 + index * 22}px`;
      labels[index].style.top = `${(1 - projection.y) * host.clientHeight / 2 - 16}px`;
    });
  });
  return {
    setProbe(position) { probe.position.set(...position); probe.visible = true; },
    select(index) {
      lines.forEach((line, i) => { line.material.opacity = i === index ? 1 : 0.3; line.renderOrder = i === index ? 1 : 0; });
    },
    dispose() {
      renderer.setAnimationLoop(null); observer.disconnect(); controls.dispose();
      scene.traverse(object => { object.geometry?.dispose(); object.material?.dispose(); });
      renderer.dispose(); renderer.domElement.remove();
    }
  };
}
