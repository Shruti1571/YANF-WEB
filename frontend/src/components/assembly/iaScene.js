// Innovation Assembly — "Ignition": a live particle film.
// ~9,000 glowing particles morph through four forms as the visitor scrolls:
// a light bulb (the idea) → a rocket (the pitch) → rising bars (the investment) → a globe (the company).
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

const rnd = (a = -1, b = 1) => a + Math.random() * (b - a);

function bulb(n) {
  const out = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const r = Math.random(); let x, y, z;
    if (r < 0.58) { // glass dome
      const v = new THREE.Vector3().randomDirection(); if (v.y < -0.55) v.y = -0.55 - Math.random() * 0.1;
      x = v.x * 0.92; y = 0.55 + v.y * 0.92; z = v.z * 0.92;
    } else if (r < 0.7) { // neck
      const t = Math.random(), a = rnd(0, Math.PI * 2), rr = 0.5 - t * 0.16; x = Math.cos(a) * rr; z = Math.sin(a) * rr; y = -0.2 - t * 0.38;
    } else if (r < 0.86) { // screw base with threads
      const t = Math.random(), a = rnd(0, Math.PI * 2), rr = 0.34 + 0.03 * Math.sin(t * 40); x = Math.cos(a) * rr; z = Math.sin(a) * rr; y = -0.6 - t * 0.42;
    } else { // filament
      const t = Math.random(); const a = t * Math.PI * 7; x = Math.cos(a) * 0.12 * (1 - Math.abs(t - 0.5)); z = Math.sin(a) * 0.12; y = 0.05 + t * 0.6 + rnd(-0.015, 0.015);
    }
    out.set([x, y, z], i * 3);
  }
  return out;
}
function rocket(n) {
  const out = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const r = Math.random(); let x, y, z; const a = rnd(0, Math.PI * 2);
    if (r < 0.42) { const t = Math.random(); const rr = 0.34; x = Math.cos(a) * rr; z = Math.sin(a) * rr; y = -0.75 + t * 1.35; }
    else if (r < 0.56) { const t = Math.pow(Math.random(), 0.8); const rr = 0.34 * (1 - t); x = Math.cos(a) * rr; z = Math.sin(a) * rr; y = 0.6 + t * 0.7; }
    else if (r < 0.66) { const f = Math.floor(Math.random() * 3) * (Math.PI * 2 / 3); const u = Math.random(), v = Math.random(); const rr = 0.34 + u * 0.36 * (1 - v); x = Math.cos(f) * rr; z = Math.sin(f) * rr; y = -0.78 + v * 0.55 * (1 - u * 0.6); }
    else if (r < 0.7) { const rr = 0.13; x = Math.cos(a) * rr; z = 0.34; y = 0.25 + Math.sin(a) * rr; } // window
    else { const t = Math.pow(Math.random(), 0.6); const rr = Math.random() * (0.08 + t * 0.5); x = Math.cos(a) * rr; z = Math.sin(a) * rr; y = -0.82 - t * 1.6; }
    out.set([x, y, z], i * 3);
  }
  return out;
}
function bars(n) {
  const out = new Float32Array(n * 3); const H = [0.45, 0.75, 1.1, 1.55, 2.15];
  for (let i = 0; i < n; i++) {
    const r = Math.random(); let x, y, z;
    if (r < 0.8) {
      const b = Math.floor(Math.random() * 5); const cx = -1.2 + b * 0.6; const h = H[b];
      const face = Math.random(); const u = rnd(-0.2, 0.2), v = Math.random() * h;
      if (face < 0.25) { x = cx + u; y = -1 + v; z = 0.2; } else if (face < 0.5) { x = cx + u; y = -1 + v; z = -0.2; }
      else if (face < 0.75) { x = cx + (Math.random() < 0.5 ? -0.2 : 0.2); y = -1 + v; z = u; } else { x = cx + u; y = -1 + h; z = rnd(-0.2, 0.2); }
    } else { // rising arrow
      const t = Math.random(); x = -1.5 + t * 3.1; y = -0.6 + Math.pow(t, 1.6) * 2.1 + rnd(-0.02, 0.02); z = 0.45;
      if (t > 0.94) { const k = (t - 0.94) / 0.06; x += rnd(-0.12, 0.05) * k; y += rnd(-0.12, 0.05) * k; }
    }
    out.set([x * 0.78 - 0.35, y * 0.9, z], i * 3);
  }
  return out;
}
function globe(n) {
  const out = new Float32Array(n * 3); const R = 1.15;
  for (let i = 0; i < n; i++) {
    const r = Math.random(); let v;
    if (r < 0.55) v = new THREE.Vector3().randomDirection().multiplyScalar(R);
    else if (r < 0.8) { const lat = (Math.floor(Math.random() * 7) - 3) * 0.38; const a = rnd(0, Math.PI * 2); v = new THREE.Vector3(Math.cos(a) * Math.cos(lat) * R, Math.sin(lat) * R, Math.sin(a) * Math.cos(lat) * R); }
    else if (r < 0.93) { const lon = Math.floor(Math.random() * 8) * Math.PI / 8; const a = rnd(0, Math.PI * 2); v = new THREE.Vector3(Math.cos(a) * R, Math.sin(a) * R, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), lon); }
    else { const a = rnd(0, Math.PI * 2); const rr = 1.75 + rnd(-0.03, 0.03); v = new THREE.Vector3(Math.cos(a) * rr, 0, Math.sin(a) * rr).applyAxisAngle(new THREE.Vector3(1, 0, 0), 0.42); }
    out.set([v.x, v.y, v.z], i * 3);
  }
  return out;
}

export function mountIgnition(host, getProgress, reduce) {
  const phone = window.innerWidth < 760;
  const N = phone ? 5200 : 9000;
  const canvas = document.createElement('canvas'); canvas.className = 'as-full'; canvas.setAttribute('aria-hidden', 'true'); host.appendChild(canvas);
  let r;
  try { r = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' }); }
  catch (e) { console.warn('ignition: no WebGL', e); canvas.remove(); return () => {}; }
  const DPR = Math.min(window.devicePixelRatio || 1, phone ? 1.6 : 2);
  r.setPixelRatio(DPR); r.setClearColor(0x050507, 1); r.outputColorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene(); const cam = new THREE.PerspectiveCamera(36, 1, 0.1, 100); cam.position.set(0, 0.15, 6.2);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(bulb(N), 3));
  geo.setAttribute('aB', new THREE.BufferAttribute(rocket(N), 3));
  geo.setAttribute('aC', new THREE.BufferAttribute(bars(N), 3));
  geo.setAttribute('aD', new THREE.BufferAttribute(globe(N), 3));
  const rand = new Float32Array(N * 4); for (let i = 0; i < N; i++) rand.set([rnd(), rnd(), rnd(), Math.random()], i * 4);
  geo.setAttribute('aR', new THREE.BufferAttribute(rand, 4));
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uM: { value: 0 }, uT: { value: 0 }, uSize: { value: (phone ? 15 : 13) * DPR }, uIntro: { value: 0 } },
    vertexShader: `
      attribute vec3 aB; attribute vec3 aC; attribute vec3 aD; attribute vec4 aR;
      uniform float uM; uniform float uT; uniform float uSize; uniform float uIntro;
      varying vec3 vCol; varying float vA;
      void main(){
        float w0=clamp(1.-abs(uM-0.),0.,1.), w1=clamp(1.-abs(uM-1.),0.,1.), w2=clamp(1.-abs(uM-2.),0.,1.), w3=clamp(1.-abs(uM-3.),0.,1.);
        vec3 p = position*w0 + aB*w1 + aC*w2 + aD*w3;
        float f = fract(uM); float burst = sin(f*3.14159)*(uM<3.0?1.:0.);
        p += aR.xyz * (burst*1.25 + 0.025*sin(uT*1.5+aR.w*30.));
        p += aR.xyz * (1.0-uIntro) * 4.0;
        // rocket plume flicker
        p.y += w1 * step(p.y,-0.8) * sin(uT*12.+aR.w*50.)*0.06;
        vec4 mv = modelViewMatrix*vec4(p,1.);
        gl_Position = projectionMatrix*mv;
        gl_PointSize = uSize*(0.35+aR.w*0.9)/(-mv.z);
        vec3 gold=vec3(1.0,.72,.32), cyan=vec3(.32,.92,1.0), violet=vec3(.62,.5,1.0), white=vec3(1.,.95,.85);
        vec3 c = mix(gold, white, step(.86,aR.w));
        c = mix(c, mix(cyan,white,step(.9,aR.w)), w1*step(-0.8,-p.y) + w3*0.85);
        c = mix(c, mix(violet,cyan,aR.w), w2*0.6);
        c = mix(c, vec3(1.,.55,.2), w1*step(p.y,-0.8));
        vCol = c; vA = (0.5+0.5*aR.w)*uIntro;
      }`,
    fragmentShader: `varying vec3 vCol; varying float vA;
      void main(){ vec2 d=gl_PointCoord-.5; float r=length(d); if(r>.5) discard; float g=pow(1.-r*2.,1.8); gl_FragColor=vec4(vCol*g*1.4, g*vA); }`,
  });
  const pts = new THREE.Points(geo, mat); scene.add(pts);
  // dust
  const dn = phone ? 600 : 1400; const dp = new Float32Array(dn * 3); for (let i = 0; i < dn; i++) dp.set([rnd(-9, 9), rnd(-5, 5), rnd(-8, 2)], i * 3);
  const dg = new THREE.BufferGeometry(); dg.setAttribute('position', new THREE.BufferAttribute(dp, 3));
  const dust = new THREE.Points(dg, new THREE.PointsMaterial({ color: 0x8fa8ff, size: 0.018, transparent: true, opacity: 0.6, depthWrite: false }));
  scene.add(dust);
  // grid floor
  const grid = new THREE.GridHelper(40, 60, 0x2a2f55, 0x161a30); grid.position.y = -2.2; grid.material.transparent = true; grid.material.opacity = 0.55; scene.add(grid);

  let composer = null;
  if (!phone) {
    composer = new EffectComposer(r); composer.addPass(new RenderPass(scene, cam));
    composer.addPass(new UnrealBloomPass(new THREE.Vector2(256, 256), 0.95, 0.55, 0.12)); composer.addPass(new OutputPass());
  }
  let w = 0, h = 0;
  const resize = () => { w = host.clientWidth; h = host.clientHeight; if (!w || !h) return; r.setSize(w, h, false); if (composer) { composer.setPixelRatio(DPR); composer.setSize(w, h); } cam.aspect = w / h; cam.updateProjectionMatrix(); };
  const ro = new ResizeObserver(resize); ro.observe(host); resize();
  let visible = true; const io = new IntersectionObserver(es => es.forEach(e => (visible = e.isIntersecting))); io.observe(host);

  let mx = 0, my = 0; const onMove = (e) => { mx = e.clientX / window.innerWidth - 0.5; my = e.clientY / window.innerHeight - 0.5; };
  window.addEventListener('pointermove', onMove);
  const t0 = performance.now(); let raf = 0, spin = 0, sm = 0, intro = reduce ? 1 : 0;
  const frame = () => {
    const t = reduce ? 4 : (performance.now() - t0) / 1000;
    const p = getProgress();
    const c = Math.max(0, (p - 0.06) / 0.94 * 4.2); const ci = Math.min(3, Math.floor(c)); const cf = c - Math.floor(c);
    const ss = (x) => { const k = Math.min(1, Math.max(0, (x - 0.72) / 0.28)); return k * k * (3 - 2 * k); };
    const target = ci >= 3 ? 3 : ci + ss(cf);
    sm += (target - sm) * (reduce ? 1 : 0.06);
    intro = Math.min(1, intro + 0.012);
    mat.uniforms.uM.value = sm; mat.uniforms.uT.value = t; mat.uniforms.uIntro.value = 1 - Math.pow(1 - intro, 3);
    const wB = Math.max(0, 1 - Math.abs(sm - 2)); spin += (1 - wB) * 0.0037; if (wB > 0.5) spin += (Math.round(spin / (Math.PI * 2)) * Math.PI * 2 - spin) * 0.08;
    pts.rotation.y = spin + wB * Math.sin(t * 0.5) * 0.3 + mx * 0.6; pts.rotation.x = -my * 0.25 + (sm > 2.5 ? 0.15 : 0);
    const side = phone ? 0 : (w / h > 1.25 ? 1.35 : 0.9);
    pts.position.x += (side - pts.position.x) * 0.06; pts.position.y = phone ? 0.55 : 0.05;
    dust.rotation.y = t * 0.02; grid.position.z = (t * 0.6) % (40 / 60);
    cam.position.z = 6.2 - Math.sin(Math.min(1, p) * Math.PI) * 0.6;
    if (composer) composer.render(); else r.render(scene, cam);
  };
  const loop = () => { if (!document.hidden && visible && w) frame(); raf = requestAnimationFrame(loop); };
  if (reduce) frame(); else raf = requestAnimationFrame(loop);

  return () => {
    cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); window.removeEventListener('pointermove', onMove);
    geo.dispose(); mat.dispose(); dg.dispose(); dust.material.dispose(); grid.geometry.dispose(); grid.material.dispose();
    if (composer) composer.dispose(); r.dispose(); r.forceContextLoss(); canvas.remove();
  };
}
