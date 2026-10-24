const COLORS = ['#8498b0', '#6de2b4', '#f5b96b', '#91adff', '#e6a1e8', '#6ed4e3'];
export const legColor = (index) => COLORS[index % COLORS.length];
export const REFERENCE_ORBITS = [
  { name: 'Earth', radius_AU: 1 },
  { name: 'Jupiter', radius_AU: 5.2 }
];

function circlePoints(radius_AU, count = 128) {
  return Array.from({ length: count }, (_, i) => {
    const angle = (2 * Math.PI * i) / count;
    return [radius_AU * Math.cos(angle), radius_AU * Math.sin(angle), 0];
  });
}

function placeLabel(label, baseX, baseY, placed) {
  let x = baseX, y = baseY;
  while (placed.some(p => Math.hypot(x - p.x, y - p.y) < 26)) x += 26;
  placed.push({ x, y });
  label.style.left = `${x}px`;
  label.style.top = `${y}px`;
}

export function canvasView(host, model, labels, centralBody) {
  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-label', 'Sampled orbit legs, oblique 2D projection in AU');
  host.replaceChildren(canvas);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('This browser cannot create a 2D canvas.');
  let selected = model.legs.length - 1;
  let probePosition = null;
  const referenceOrbits = !centralBody || centralBody === 'Sun' ? REFERENCE_ORBITS : [];
  const isSkippedLeg = (index) => index > 0 && model.markers[index - 1]?.status === 'skipped';
  // An oblique projection keeps out-of-plane legs visible in the fallback.
  const project = ([x, y, z]) => [x + 0.35 * z, y + 0.2 * z];
  const bounds = [0, 0, 0, 0];
  const positions = model.legs.flatMap(leg => leg.ephemerisPoints.map(p => p.r_AU));
  positions.push(...model.markers.map(marker => marker.position));
  for (const ref of referenceOrbits) {
    positions.push([ref.radius_AU, 0, 0], [-ref.radius_AU, 0, 0], [0, ref.radius_AU, 0], [0, -ref.radius_AU, 0]);
  }
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
    ctx.save();
    for (const ref of referenceOrbits) {
      const pts = circlePoints(ref.radius_AU, 128);
      ctx.beginPath();
      pts.forEach((p, j) => {
        const [x, y] = screen(p);
        if (j === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      });
      ctx.closePath();
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = '#9fb0c5'; ctx.globalAlpha = 0.28; ctx.lineWidth = 1.1;
      ctx.stroke();
      ctx.setLineDash([]);
      const [lx, ly] = screen([ref.radius_AU * Math.SQRT1_2, -ref.radius_AU * Math.SQRT1_2, 0]);
      ctx.globalAlpha = 0.5; ctx.fillStyle = '#9fb0c5'; ctx.font = '11px system-ui';
      ctx.fillText(`${ref.name} (${ref.radius_AU} AU)`, lx + 6, ly + 4);
    }
    ctx.restore();
    // Draw the selected leg last and omit unselected skipped duplicate legs so event colors stay accurate.
    const order = model.legs.map((_, i) => i).filter(i => i !== selected && !isSkippedLeg(i)).concat(selected);
    for (const index of order) {
      const leg = model.legs[index];
      ctx.beginPath();
      leg.ephemerisPoints.forEach((p, j) => {
        const [x, y] = screen(p.r_AU);
        if (j === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      });
      if (leg.bound) ctx.closePath();
      ctx.strokeStyle = legColor(index); ctx.globalAlpha = index === selected ? 1 : 0.72;
      ctx.lineWidth = index === selected ? 3 : 1.8; ctx.stroke();
    }
    ctx.globalAlpha = 1;
    const [sx, sy] = screen([0, 0, 0]);
    ctx.fillStyle = '#ffd68a'; ctx.beginPath(); ctx.arc(sx, sy, 5, 0, Math.PI * 2); ctx.fill();
    ctx.font = '12px system-ui'; ctx.fillText(centralBody, sx + 10, sy - 8);
    const markerOrder = model.markers.map((_, i) => i).filter(i => i + 1 !== selected);
    if (selected > 0 && selected <= model.markers.length) markerOrder.push(selected - 1);
    for (const index of markerOrder) {
      const marker = model.markers[index];
      const [x, y] = screen(marker.position);
      const active = index + 1 === selected;
      ctx.fillStyle = legColor(index + 1);
      ctx.beginPath(); ctx.arc(x, y, active ? 4.5 : 3.5, 0, Math.PI * 2); ctx.fill();
    }
    const placed = [];
    model.markers.forEach((marker, index) => {
      const [x, y] = screen(marker.position);
      placeLabel(labels[index], x + 14, y - 16, placed);
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
  const referenceOrbits = !centralBody || centralBody === 'Sun' ? REFERENCE_ORBITS : [];
  const isSkippedLeg = (index) => index > 0 && model.markers[index - 1]?.status === 'skipped';
  let radius = 0;

  const createRibbon = (points, closed, color, opacity, halfWidthPx, renderOrder) => {
    const seq = closed ? [...points, points[0]] : points;
    const m = seq.length;
    const n = points.length;
    const tangents = seq.map((_, k) => {
      if (closed) {
        const i = k % n;
        return points[(i + 1) % n].clone().sub(points[(i - 1 + n) % n]).normalize();
      }
      if (k === 0) return seq[1].clone().sub(seq[0]).normalize();
      if (k === m - 1) return seq[m - 1].clone().sub(seq[m - 2]).normalize();
      return seq[k + 1].clone().sub(seq[k - 1]).normalize();
    });
    const positionArray = new Float32Array(m * 6);
    const positionAttr = new THREE.BufferAttribute(positionArray, 3);
    const indices = [];
    for (let k = 0; k < m - 1; k++) {
      const a = 2 * k, b = a + 1, c = a + 2, d = a + 3;
      indices.push(a, b, c, b, d, c);
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', positionAttr);
    geometry.setIndex(indices);
    const material = new THREE.MeshBasicMaterial({
      color, transparent: true, opacity, side: THREE.DoubleSide, depthTest: false, depthWrite: false
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.renderOrder = renderOrder;
    mesh.frustumCulled = false;
    scene.add(mesh);
    const ribbon = {
      mesh, material, halfWidthPx,
      update(camPos, pixelScale) {
        if (!mesh.visible) return;
        let prevNx = 0, prevNy = 0, prevNz = 1;
        for (let k = 0; k < m; k++) {
          const p = seq[k], t = tangents[k];
          const vx = p.x - camPos.x, vy = p.y - camPos.y, vz = p.z - camPos.z;
          const dist = Math.hypot(vx, vy, vz);
          let nx = t.y * vz - t.z * vy;
          let ny = t.z * vx - t.x * vz;
          let nz = t.x * vy - t.y * vx;
          const nLen = Math.hypot(nx, ny, nz);
          if (nLen > 1e-9) {
            nx /= nLen; ny /= nLen; nz /= nLen;
            prevNx = nx; prevNy = ny; prevNz = nz;
          } else {
            nx = prevNx; ny = prevNy; nz = prevNz;
          }
          const offset = ribbon.halfWidthPx * dist * pixelScale;
          const base = k * 6;
          positionArray[base] = p.x + nx * offset;
          positionArray[base + 1] = p.y + ny * offset;
          positionArray[base + 2] = p.z + nz * offset;
          positionArray[base + 3] = p.x - nx * offset;
          positionArray[base + 4] = p.y - ny * offset;
          positionArray[base + 5] = p.z - nz * offset;
        }
        positionAttr.needsUpdate = true;
      }
    };
    return ribbon;
  };

  const ribbons = [];
  for (const ref of referenceOrbits) {
    radius = Math.max(radius, ref.radius_AU);
    const circle = circlePoints(ref.radius_AU, 128).map(p => new THREE.Vector3(...p));
    const dashPoints = [];
    for (let i = 0; i < circle.length; i += 2) {
      dashPoints.push(circle[i], circle[(i + 1) % circle.length]);
    }
    const dashGeometry = new THREE.BufferGeometry().setFromPoints(dashPoints);
    const dashMaterial = new THREE.LineBasicMaterial({
      color: '#9fb0c5', transparent: true, opacity: 0.42, depthTest: false
    });
    const refLine = new THREE.LineSegments(dashGeometry, dashMaterial);
    refLine.name = `${ref.name} (${ref.radius_AU} AU)`;
    refLine.renderOrder = 0;
    scene.add(refLine);
    ribbons.push(createRibbon(circle, true, '#9fb0c5', 0.2, 0.75, 0));
    const labelCanvas = document.createElement('canvas');
    labelCanvas.width = 220; labelCanvas.height = 44;
    const labelCtx = labelCanvas.getContext('2d');
    if (labelCtx && THREE.CanvasTexture && THREE.Sprite && THREE.SpriteMaterial) {
      labelCtx.font = '500 22px system-ui, sans-serif';
      labelCtx.fillStyle = '#9fb0c5';
      labelCtx.textAlign = 'center';
      labelCtx.textBaseline = 'middle';
      labelCtx.fillText(`${ref.name} · ${ref.radius_AU} AU`, 110, 22);
      const texture = new THREE.CanvasTexture(labelCanvas);
      const spriteMat = new THREE.SpriteMaterial({
        map: texture, transparent: true, opacity: 0.65, depthTest: false, sizeAttenuation: false
      });
      const sprite = new THREE.Sprite(spriteMat);
      sprite.center.set(0.5, 1.15);
      sprite.position.set(0, -ref.radius_AU, 0);
      sprite.scale.set(0.11, 0.022, 1);
      sprite.renderOrder = 0;
      scene.add(sprite);
    }
  }

  const legs = model.legs.map((leg, index) => {
    const points = leg.ephemerisPoints.map(p => {
      radius = Math.max(radius, Math.hypot(...p.r_AU));
      return new THREE.Vector3(...p.r_AU);
    });
    // Close elliptic orbits only; open conics must stay polylines.
    if (leg.bound) points.pop();
    const color = legColor(index);
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({
      color, transparent: true, opacity: 0.82, linewidth: 2, depthTest: false
    });
    const line = leg.bound ? new THREE.LineLoop(geometry, material) : new THREE.Line(geometry, material);
    line.renderOrder = 1;
    scene.add(line);
    const ribbon = createRibbon(points, leg.bound, color, 0.62, 1.15, 1);
    ribbons.push(ribbon);
    return { line, ribbon };
  });

  for (const marker of model.markers) radius = Math.max(radius, Math.hypot(...marker.position));
  radius = Math.max(radius, 1e-8);
  camera.near = radius / 10000; camera.far = radius * 1000;
  controls.minDistance = radius / 1000; controls.maxDistance = radius * 100;
  const geometry = new THREE.SphereGeometry(radius / 170, 14, 10);
  const body = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ color: '#ffd68a', depthTest: false }));
  body.name = centralBody; body.renderOrder = 3; scene.add(body);
  const dots = model.markers.map((marker, i) => {
    const dot = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ color: legColor(i + 1), depthTest: false }));
    dot.position.set(...marker.position); dot.renderOrder = 3; scene.add(dot); return dot;
  });
  // A screen-sized point stays visible at every camera zoom level.
  const probeGeometry = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3()]);
  const probe = new THREE.Points(probeGeometry, new THREE.PointsMaterial({
    color: '#ffffff', size: 12, sizeAttenuation: false, depthTest: false
  }));
  probe.visible = false; probe.renderOrder = 5; scene.add(probe);
  host.replaceChildren(renderer.domElement);
  renderer.domElement.setAttribute('aria-label', `3D orbit legs around ${centralBody}, coordinates in AU`);
  renderer.domElement.addEventListener('webglcontextlost', (event) => { event.preventDefault(); onContextLost(); }, { once: true });
  let fitted = false;
  const resize = () => {
    const width = Math.max(1, host.clientWidth), height = Math.max(1, host.clientHeight);
    renderer.setSize(width, height); camera.aspect = width / height;
    if (!fitted) {
      camera.position.set(0, -0.65, 1).normalize().multiplyScalar(radius * 2.4 / Math.min(1, camera.aspect));
      fitted = true;
    }
    camera.updateProjectionMatrix(); controls.update();
  };
  const observer = new ResizeObserver(resize); observer.observe(host); resize();
  const projection = new THREE.Vector3();
  renderer.setAnimationLoop(() => {
    controls.update();
    const pixelScale = (2 * Math.tan(camera.fov * Math.PI / 360)) / Math.max(1, host.clientHeight);
    for (const ribbon of ribbons) ribbon.update(camera.position, pixelScale);
    renderer.render(scene, camera);
    const placed = [];
    dots.forEach((dot, index) => {
      projection.copy(dot.position).project(camera);
      const hidden = Math.abs(projection.x) > 1 || Math.abs(projection.y) > 1 || Math.abs(projection.z) > 1;
      labels[index].hidden = hidden;
      if (!hidden) {
        const x = (projection.x + 1) * host.clientWidth / 2 + 14;
        const y = (1 - projection.y) * host.clientHeight / 2 - 16;
        placeLabel(labels[index], x, y, placed);
      }
    });
  });
  return {
    setProbe(position) { probe.position.set(...position); probe.visible = true; },
    select(index) {
      legs.forEach(({ line, ribbon }, i) => {
        const active = i === index;
        const visible = active || !isSkippedLeg(i);
        line.visible = visible;
        ribbon.mesh.visible = visible;
        line.material.opacity = active ? 1 : 0.82;
        ribbon.material.opacity = active ? 0.92 : 0.62;
        ribbon.halfWidthPx = active ? 2.1 : 1.15;
        line.renderOrder = active ? 2 : 1;
        ribbon.mesh.renderOrder = active ? 2 : 1;
      });
      dots.forEach((dot, i) => {
        const active = i + 1 === index;
        dot.renderOrder = active ? 4 : 3;
        dot.scale.setScalar(active ? 1.35 : 1);
      });
    },
    dispose() {
      renderer.setAnimationLoop(null); observer.disconnect(); controls.dispose();
      scene.traverse(object => {
        object.geometry?.dispose();
        object.material?.map?.dispose();
        object.material?.dispose();
      });
      renderer.dispose(); renderer.domElement.remove();
    }
  };
}
