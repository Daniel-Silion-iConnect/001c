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
  const width = label.offsetWidth + 6, height = label.offsetHeight + 6;
  const host = label.parentElement;
  // Search around the event, keeping buttons inside the plot and clear of annotations.
  for (let ring = 0; ring < 30; ring++) {
    for (let dy = -ring; dy <= ring; dy++) for (let dx = -ring; dx <= ring; dx++) {
      if (Math.max(Math.abs(dx), Math.abs(dy)) !== ring) continue;
      const x = Math.max(width / 2, Math.min(host.clientWidth - width / 2, baseX + dx * 26));
      const y = Math.max(height / 2, Math.min(host.clientHeight - height / 2, baseY + dy * 26));
      const rect = { x: x - width / 2, y: y - height / 2, width, height };
      if (placed.some(p => rect.x < p.x + p.width && rect.x + width > p.x
        && rect.y < p.y + p.height && rect.y + height > p.y)) continue;
      placed.push(rect);
      label.style.left = `${x}px`;
      label.style.top = `${y}px`;
      return;
    }
  }
}

// HTML annotations retain their CSS pixel size in either projection and at every zoom.
function sceneLabels(host, centralBody, referenceOrbits) {
  const layer = document.createElement('div');
  layer.className = 'scene-labels';
  const marker = document.createElement('span');
  marker.className = 'body-marker'; marker.setAttribute('aria-hidden', 'true');
  layer.append(marker);
  const annotations = [
    { text: centralBody, position: [0, 0, 0], body: true },
    ...referenceOrbits.map(ref => ({ text: `${ref.name} ${ref.radius_AU} AU`, position: [0, ref.radius_AU, 0] }))
  ].map(annotation => {
    const label = document.createElement('span');
    label.className = `scene-label${annotation.body ? ' body-label' : ''}`;
    label.textContent = annotation.text; layer.append(label);
    return { ...annotation, label };
  });
  host.append(layer);
  return {
    update(screen) {
      // Leave room for the renderer instructions along the bottom of the plot.
      const placed = [{ x: 0, y: host.clientHeight - 64, width: host.clientWidth, height: 64 }];
      for (const { label, position, body } of annotations) {
        const [px, py, visible = true] = screen(position);
        label.hidden = !visible;
        if (body) {
          marker.hidden = !visible;
          marker.style.left = `${px}px`; marker.style.top = `${py}px`;
          if (visible) placed.push({ x: px - 11, y: py - 11, width: 22, height: 22 });
        }
        if (!visible) continue;
        const width = label.offsetWidth, height = label.offsetHeight;
        const x = Math.max(4, Math.min(host.clientWidth - width - 4, px + 13));
        const preferredY = py + (body ? -34 : 12);
        let y = 4;
        // Labels near the Sun can be closer than a text line when fitting a 30 AU path.
        // Search above and below the anchor, also when the orbit is near a plot edge.
        for (let step = 0; step < 30; step++) {
          const offset = Math.ceil(step / 2) * (height + 4) * (step % 2 ? 1 : -1);
          y = Math.max(4, Math.min(host.clientHeight - height - 4, preferredY + offset));
          if (!placed.some(p => x < p.x + p.width + 4 && x + width + 4 > p.x
            && y < p.y + p.height + 4 && y + height + 4 > p.y)) break;
        }
        label.style.left = `${x}px`; label.style.top = `${y}px`;
        placed.push({ x, y, width, height });
      }
      return placed;
    },
    dispose() { layer.remove(); }
  };
}

// `arcs` are the continuous event-to-event paths; full conics are an optional faint overlay.
const CONIC_OVERLAY_OPACITY = 0.2;

export function canvasView(host, model, labels, centralBody, arcs) {
  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-label', 'Sampled orbit legs, oblique 2D projection in AU');
  host.replaceChildren(canvas);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('This browser cannot create a 2D canvas.');
  let selected = model.legs.length - 1;
  let probePosition = null;
  let showConics = false;
  const referenceOrbits = !centralBody || centralBody === 'Sun' ? REFERENCE_ORBITS : [];
  const isSkippedLeg = (index) => index > 0 && model.markers[index - 1]?.status === 'skipped';
  const annotations = sceneLabels(host, centralBody, referenceOrbits);
  // An oblique projection keeps out-of-plane legs visible in the fallback.
  const project = ([x, y, z]) => [x + 0.35 * z, y + 0.2 * z];
  const bounds = [0, 0, 0, 0];
  // Fit the continuous path; the optional full-conic overlay may extend past the frame.
  const positions = arcs.flatMap(arc => arc.points.map(p => p.r_AU));
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
    }
    ctx.restore();
    // Draw the selected leg last and omit unselected skipped duplicate legs so event colors stay accurate.
    const order = model.legs.map((_, i) => i).filter(i => i !== selected && !isSkippedLeg(i)).concat(selected);
    const stroke = (points) => {
      ctx.beginPath();
      points.forEach((p, j) => {
        const [x, y] = screen(p.r_AU);
        if (j === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      });
    };
    if (showConics) {
      for (const index of order) {
        const leg = model.legs[index];
        stroke(leg.ephemerisPoints);
        if (leg.bound) ctx.closePath();
        ctx.strokeStyle = legColor(index); ctx.globalAlpha = CONIC_OVERLAY_OPACITY;
        ctx.lineWidth = 1; ctx.stroke();
      }
    }
    for (const index of order) {
      stroke(arcs[index].points);
      ctx.strokeStyle = legColor(index); ctx.globalAlpha = index === selected ? 1 : 0.8;
      ctx.lineWidth = index === selected ? 3 : 1.8; ctx.stroke();
    }
    ctx.globalAlpha = 1;
    const placed = annotations.update(screen);
    placed.push({ x: 12, y: 6, width: 110, height: 30 }); // Keep the scale bar readable.
    ctx.font = '14px system-ui';
    const markerOrder = model.markers.map((_, i) => i).filter(i => i + 1 !== selected);
    if (selected > 0 && selected <= model.markers.length) markerOrder.push(selected - 1);
    for (const index of markerOrder) {
      const marker = model.markers[index];
      const [x, y] = screen(marker.position);
      const active = index + 1 === selected;
      ctx.fillStyle = legColor(index + 1);
      ctx.beginPath(); ctx.arc(x, y, active ? 4.5 : 3.5, 0, Math.PI * 2); ctx.fill();
    }
    model.markers.forEach((marker, index) => {
      const [x, y] = screen(marker.position);
      labels[index].hidden = false;
      placeLabel(labels[index], x + 14, y - 16, placed);
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
    setShowConics(value) { showConics = Boolean(value); draw(); },
    dispose() { observer.disconnect(); annotations.dispose(); canvas.remove(); }
  };
}

export function threeView(host, model, labels, centralBody, THREE, OrbitControls, onContextLost, arcs) {
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
  }

  // Faint full conics, hidden until the 'Show full conics' toggle enables them.
  const conics = model.legs.map((leg, index) => {
    const points = leg.ephemerisPoints.map(p => new THREE.Vector3(...p.r_AU));
    // Close elliptic orbits only; open conics must stay polylines.
    if (leg.bound) points.pop();
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({
      color: legColor(index), transparent: true, opacity: CONIC_OVERLAY_OPACITY, depthTest: false
    });
    const line = leg.bound ? new THREE.LineLoop(geometry, material) : new THREE.Line(geometry, material);
    line.renderOrder = 0; line.visible = false;
    scene.add(line);
    return line;
  });
  // The continuous event-to-event path: each leg is an open arc ending at the next event.
  const legs = arcs.map((arc, index) => {
    const points = arc.points.map(p => {
      radius = Math.max(radius, Math.hypot(...p.r_AU));
      return new THREE.Vector3(...p.r_AU);
    });
    const color = legColor(index);
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({
      color, transparent: true, opacity: 0.82, linewidth: 2, depthTest: false
    });
    const line = new THREE.Line(geometry, material);
    line.renderOrder = 1;
    scene.add(line);
    const ribbon = createRibbon(points, false, color, 0.62, 1.15, 1);
    ribbons.push(ribbon);
    return { line, ribbon };
  });
  let showConics = false;

  for (const marker of model.markers) radius = Math.max(radius, Math.hypot(...marker.position));
  radius = Math.max(radius, 1e-8);
  camera.near = radius / 10000; camera.far = radius * 1000;
  controls.minDistance = radius / 1000; controls.maxDistance = radius * 100;
  const geometry = new THREE.SphereGeometry(radius / 170, 14, 10);
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
  const annotations = sceneLabels(host, centralBody, referenceOrbits);
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
    const placed = annotations.update(position => {
      projection.set(...position).project(camera);
      return [(projection.x + 1) * host.clientWidth / 2, (1 - projection.y) * host.clientHeight / 2,
        Math.abs(projection.x) <= 1 && Math.abs(projection.y) <= 1 && Math.abs(projection.z) <= 1];
    });
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
    setShowConics(value) {
      showConics = Boolean(value);
      conics.forEach((line, i) => { line.visible = showConics && !isSkippedLeg(i); });
    },
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
      annotations.dispose(); renderer.dispose(); renderer.domElement.remove();
    }
  };
}
