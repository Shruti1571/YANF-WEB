// Gallery — "The Archive": photographs hung on a glowing 3D helix.
// The camera rides up the spiral as the visitor scrolls; drag to turn, click a print to open it.
import * as THREE from 'three';

export function mountArchive(host, photos, { getProgress, onOpen, reduce }) {
  const phone = window.innerWidth < 760;
  const canvas = document.createElement('canvas'); canvas.className = 'as-full'; host.appendChild(canvas);
  let r;
  try { r = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' }); }
  catch (e) { console.warn('archive: no WebGL', e); canvas.remove(); return () => {}; }
  const DPR = Math.min(window.devicePixelRatio || 1, phone ? 1.6 : 2);
  r.setPixelRatio(DPR); r.setClearColor(0x07060a, 1); r.outputColorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene(); scene.fog = new THREE.Fog(0x07060a, 4, 13);
  const cam = new THREE.PerspectiveCamera(phone ? 62 : 52, 1, 0.1, 60);

  const list = photos.slice(0, 36); const PER = 9; const R = phone ? 3.2 : 3.6; const STEP_Y = 0.62; const W = 1.7, H = 1.06;
  const total = (list.length - 1) * STEP_Y;
  const group = new THREE.Group(); scene.add(group);
  const loader = new THREE.TextureLoader(); const frames = [];
  const frameMat = new THREE.MeshBasicMaterial({ color: 0xe9c77b, transparent: true, opacity: 0.55, side: THREE.DoubleSide });
  const plane = new THREE.PlaneGeometry(W, H), border = new THREE.PlaneGeometry(W + 0.06, H + 0.06);
  list.forEach((p, i) => {
    const a = (i / PER) * Math.PI * 2; const y = total / 2 - i * STEP_Y;
    const holder = new THREE.Group(); holder.position.set(Math.sin(a) * R, y, Math.cos(a) * R); holder.lookAt(0, y, 0);
    const mat = new THREE.MeshBasicMaterial({ color: 0x222222, side: THREE.DoubleSide, transparent: true });
    loader.load(p.url, (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
      const img = tex.image; const ia = img.width / img.height, pa = W / H; // cover-crop
      if (ia > pa) { tex.repeat.set(pa / ia, 1); tex.offset.set((1 - pa / ia) / 2, 0); } else { tex.repeat.set(1, ia / pa); tex.offset.set(0, (1 - ia / pa) / 2); }
      mat.map = tex; mat.color.set(0xffffff); mat.needsUpdate = true;
    });
    const m = new THREE.Mesh(plane, mat); m.userData.index = i; m.position.z = 0.005;
    const b = new THREE.Mesh(border, frameMat);
    holder.add(b); holder.add(m); group.add(holder); frames.push({ holder, m, hover: 0 });
  });
  // the spine: a thin glowing helix line and dust
  const pts = []; for (let k = 0; k <= 400; k++) { const t = k / 400; const a = t * (list.length / PER) * Math.PI * 2; pts.push(new THREE.Vector3(Math.sin(a) * (R + 0.02), total / 2 + 0.7 - t * (total + 1.4), Math.cos(a) * (R + 0.02))); }
  const spine = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: 0xe9c77b, transparent: true, opacity: 0.35 }));
  group.add(spine);
  const dn = phone ? 500 : 1200, dp = new Float32Array(dn * 3);
  for (let i = 0; i < dn; i++) { const a = Math.random() * Math.PI * 2, rr = 1 + Math.random() * 6; dp.set([Math.sin(a) * rr, (Math.random() - 0.5) * (total + 8), Math.cos(a) * rr], i * 3); }
  const dg = new THREE.BufferGeometry(); dg.setAttribute('position', new THREE.BufferAttribute(dp, 3));
  const dust = new THREE.Points(dg, new THREE.PointsMaterial({ color: 0xffd9a0, size: 0.022, transparent: true, opacity: 0.55, depthWrite: false }));
  group.add(dust);

  let w = 0, h = 0;
  const resize = () => { w = host.clientWidth; h = host.clientHeight; if (!w || !h) return; r.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); };
  const ro = new ResizeObserver(resize); ro.observe(host); resize();
  let visible = true; const io = new IntersectionObserver(es => es.forEach(e => (visible = e.isIntersecting))); io.observe(host);

  // drag to turn, hover + click to open
  let drag = null, spinV = 0, spinOff = 0, moved = 0; const ray = new THREE.Raycaster(); const ndc = new THREE.Vector2(9, 9); let hovered = -1;
  const pick = () => { ray.setFromCamera(ndc, cam); const hit = ray.intersectObjects(frames.map(f => f.m))[0]; return hit ? hit.object.userData.index : -1; };
  const setNdc = (e) => { const b = canvas.getBoundingClientRect(); ndc.set(((e.clientX - b.left) / b.width) * 2 - 1, -((e.clientY - b.top) / b.height) * 2 + 1); };
  const down = (e) => { drag = { x: e.clientX }; moved = 0; };
  const move = (e) => { setNdc(e); if (drag) { const dx = e.clientX - drag.x; drag.x = e.clientX; moved += Math.abs(dx); spinOff += dx * 0.005; spinV = dx * 0.005; } };
  const up = () => { if (drag && moved < 6) { const i = pick(); if (i >= 0) onOpen(i); } drag = null; };
  const leave = () => { ndc.set(9, 9); drag = null; };
  canvas.addEventListener('pointerdown', down); canvas.addEventListener('pointermove', move); window.addEventListener('pointerup', up); canvas.addEventListener('pointerleave', leave);

  const t0 = performance.now(); let raf = 0, sp = 0;
  const frame = () => {
    const t = reduce ? 3 : (performance.now() - t0) / 1000; const p = getProgress();
    sp += (p - sp) * (reduce ? 1 : 0.08);
    if (!drag) { spinV *= 0.94; spinOff += spinV; }
    // camera rides the spiral from the top print to the bottom one
    const fi = sp * (list.length - 1); // the print we're passing
    // intro: while the title is on screen, the camera sits above the spiral so the prints wait below it
    const k = 1 - Math.min(1, Math.max(0, sp / 0.14)); const intro = k * k * (3 - 2 * k);
    const y = total / 2 - fi * STEP_Y + intro * 1.45;
    const a = (fi / PER) * Math.PI * 2 + spinOff + (reduce ? 0 : Math.sin(t * 0.25) * 0.12);
    const camR = phone ? 0.2 : 0.6 + Math.sin(sp * Math.PI) * 0.5;
    cam.position.set(Math.sin(a + Math.PI) * camR, y + 0.15, Math.cos(a + Math.PI) * camR);
    cam.lookAt(Math.sin(a) * R, y - 0.05 + intro * 0.6, Math.cos(a) * R);
    frames.forEach(f => { f.m.material.opacity = 1 - intro * 0.55; });
    frameMat.opacity = 0.55 * (1 - intro * 0.6);
    hovered = drag ? -1 : pick(); canvas.style.cursor = hovered >= 0 ? 'pointer' : (drag ? 'grabbing' : 'grab');
    frames.forEach((f, i) => { f.hover += ((i === hovered ? 1 : 0) - f.hover) * 0.15; const s = 1 + f.hover * 0.08; f.holder.scale.set(s, s, s); f.m.position.z = 0.005 + f.hover * 0.25; });
    dust.rotation.y = t * 0.03;
    r.render(scene, cam);
  };
  const loop = () => { if (!document.hidden && visible && w) frame(); raf = requestAnimationFrame(loop); };
  if (reduce) setTimeout(frame, 300); raf = requestAnimationFrame(loop);

  return () => {
    cancelAnimationFrame(raf); ro.disconnect(); io.disconnect();
    canvas.removeEventListener('pointerdown', down); canvas.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); canvas.removeEventListener('pointerleave', leave);
    scene.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) { if (o.material.map) o.material.map.dispose(); o.material.dispose(); } });
    r.dispose(); r.forceContextLoss(); canvas.remove();
  };
}
