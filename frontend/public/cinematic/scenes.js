// YANF — real-time scenes. Every visual is rendered live (WebGL / canvas), so it stays sharp at any resolution.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { MarchingCubes } from 'three/addons/objects/MarchingCubes.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

const PHONE = innerWidth < 760;
const REDUCE = matchMedia('(prefers-reduced-motion: reduce)').matches;
const P = (window.YANF_P = window.YANF_P || {});
const DPR = Math.min(devicePixelRatio || 1, PHONE ? 1.6 : 2);
const D2R = Math.PI / 180;
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a)); return t * t * (3 - 2 * t); };
const ease = t => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

const NOISE = `
float hash(vec3 p){p=fract(p*.3183099+.1);p*=17.;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}
float vnoise(vec3 x){vec3 i=floor(x);vec3 f=fract(x);f=f*f*(3.-2.*f);
 return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),
            mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);}
float fbm(vec3 p){float a=.5,s=0.;for(int i=0;i<5;i++){s+=a*vnoise(p);p*=2.03;a*=.5;}return s;}`;

/* ------------------------------------------------------------------ plumbing */
const stages = [];
class Stage {
  constructor(canvas, key, { alpha = false, bloom = null, fov = 35, far = 2000 } = {}) {
    this.canvas = canvas; this.key = key; this.visible = false; this.t0 = performance.now();
    const r = (this.r = new THREE.WebGLRenderer({ canvas, antialias: true, alpha, powerPreference: 'high-performance' }));
    r.setPixelRatio(DPR); r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = 1; r.outputColorSpace = THREE.SRGBColorSpace;
    if (alpha) r.setClearColor(0x000000, 0);
    this.scene = new THREE.Scene();
    this.cam = new THREE.PerspectiveCamera(fov, 1, 0.05, far);
    if (bloom && !PHONE) {
      this.composer = new EffectComposer(r);
      this.composer.addPass(new RenderPass(this.scene, this.cam));
      this.bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), bloom[0], bloom[1], bloom[2]);
      this.composer.addPass(this.bloom);
      this.composer.addPass(new OutputPass());
    }
    new ResizeObserver(() => this.resize()).observe(canvas);
    new IntersectionObserver(es => es.forEach(e => { this.visible = e.isIntersecting; if (this.visible && REDUCE) this.frame(); }), { rootMargin: '120px' }).observe(canvas);
    stages.push(this);
  }
  env(intensity = 0.04) { const pm = new THREE.PMREMGenerator(this.r); this.scene.environment = pm.fromScene(new RoomEnvironment(), intensity).texture; }
  resize() {
    const w = this.canvas.clientWidth, h = this.canvas.clientHeight; if (!w || !h) return;
    this.w = w; this.h = h; this.r.setSize(w, h, false);
    if (this.composer) { this.composer.setPixelRatio(DPR); this.composer.setSize(w, h); }
    this.cam.aspect = w / h; this.cam.updateProjectionMatrix(); this.onResize && this.onResize(w, h);
    if (REDUCE) this.frame();
  }
  frame() {
    const t = REDUCE ? 6 : (performance.now() - this.t0) / 1000;
    this.update(t, REDUCE ? (this.reduceP ?? 0.5) : (P[this.key] || 0));
    this.composer ? this.composer.render() : this.r.render(this.scene, this.cam);
  }
}

function glowTexture(inner = 'rgba(255,255,255,1)', outer = 'rgba(255,255,255,0)') {
  const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d');
  const rg = g.createRadialGradient(64, 64, 0, 64, 64, 64); rg.addColorStop(0, inner); rg.addColorStop(.25, inner.replace(/[\d.]+\)$/, '.45)')); rg.addColorStop(1, outer);
  g.fillStyle = rg; g.fillRect(0, 0, 128, 128); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
// lon/lat → point on a unit SphereGeometry (matches its default UV mapping)
function ll(lon, lat, r = 1) {
  const phi = (lon + 180) / 360 * Math.PI * 2, th = (90 - lat) * D2R;
  return new THREE.Vector3(-Math.cos(phi) * Math.sin(th) * r, Math.cos(th) * r, Math.sin(phi) * Math.sin(th) * r);
}

/* ------------------------------------------------------------------ 1 · EARTH */
const CAP = { delhi: [77.2, 28.6], geneva: [6.1, 46.2], newyork: [-74, 40.7], london: [-0.1, 51.5], nairobi: [36.8, -1.3], beijing: [116.4, 39.9], tokyo: [139.7, 35.7],
  brasilia: [-47.9, -15.8], moscow: [37.6, 55.8], capetown: [18.4, -33.9], singapore: [103.8, 1.35], riyadh: [46.7, 24.7], paris: [2.35, 48.86], sydney: [151.2, -33.9], lagos: [3.4, 6.5], mumbai: [72.9, 19.1] };
const ROUTES = [['delhi', 'geneva'], ['delhi', 'newyork'], ['delhi', 'tokyo'], ['delhi', 'nairobi'], ['delhi', 'moscow'], ['mumbai', 'london'], ['mumbai', 'singapore'], ['geneva', 'newyork'],
  ['london', 'lagos'], ['paris', 'riyadh'], ['beijing', 'singapore'], ['tokyo', 'sydney'], ['newyork', 'brasilia'], ['geneva', 'capetown'], ['riyadh', 'beijing'], ['delhi', 'sydney']];
const HOT = [[31, 49], [34.4, 31.4], [30, 15], [75, 34], [2, 15], [96, 20], [45, 15.5], [28, -2], [44, 33]];

class Earth extends Stage {
  constructor(canvas, key, mode) {
    super(canvas, key, { bloom: [0.55, 0.45, 0.62], fov: 35 });
    this.mode = mode; this.reduceP = mode === 'hero' ? 0.0 : 1;
    const loader = new THREE.TextureLoader();
    const map = loader.load('media/earth_night.jpg'); map.colorSpace = THREE.SRGBColorSpace; map.anisotropy = this.r.capabilities.getMaxAnisotropy();
    const mask = loader.load('media/earth_mask.png');
    this.sun = new THREE.Vector3(-1, 0.28, -0.35).normalize();
    this.globe = new THREE.Group(); this.scene.add(this.globe);
    this.mat = new THREE.ShaderMaterial({
      uniforms: { map: { value: map }, mask: { value: mask }, time: { value: 0 }, sunDir: { value: this.sun } },
      vertexShader: `varying vec2 vUv;varying vec3 vN;varying vec3 vW;varying vec3 vP;
        void main(){vUv=uv;vP=position;vN=normalize(mat3(modelMatrix)*normal);vec4 w=modelMatrix*vec4(position,1.);vW=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}`,
      fragmentShader: `uniform sampler2D map;uniform sampler2D mask;uniform float time;uniform vec3 sunDir;varying vec2 vUv;varying vec3 vN;varying vec3 vW;varying vec3 vP;${NOISE}
        void main(){
          vec3 col=texture2D(map,vUv).rgb;float land=texture2D(mask,vUv).r;
          vec3 N=normalize(vN);vec3 V=normalize(cameraPosition-vW);float ndv=max(dot(N,V),0.);float fres=pow(1.-ndv,3.);
          float lum=dot(col,vec3(.299,.587,.114));col+=col*smoothstep(.15,.8,lum)*1.1;
          float c=fbm(vP*2.4+vec3(time*.010,0.,time*.006));float cl=smoothstep(.5,.78,c);
          col=mix(col,vec3(.035,.05,.09),cl*.6);col+=vec3(.22,.3,.45)*cl*(.05+fres*.6);
          vec3 H=normalize(sunDir+V);float sp=pow(max(dot(N,H),0.),70.)*(1.-land)*(1.-cl);col+=vec3(1.,.8,.6)*sp*.25;
          
          col+=vec3(.12,.3,.95)*fres*.6;
          gl_FragColor=vec4(col,1.);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`,
    });
    this.globe.add(new THREE.Mesh(new THREE.SphereGeometry(1, 160, 160), this.mat));
    // atmosphere
    const atm = new THREE.Mesh(new THREE.SphereGeometry(1.16, 96, 96), new THREE.ShaderMaterial({
      side: THREE.BackSide, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false,
      vertexShader: `varying vec3 vN;void main(){vN=normalize(normalMatrix*normal);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
      fragmentShader: `varying vec3 vN;void main(){float i=pow(clamp(.74-dot(vN,vec3(0,0,1.)),0.,1.),5.);gl_FragColor=vec4(vec3(.3,.55,1.)*i*1.1,i);}`,
    }));
    this.scene.add(atm);
    // stars
    const sp = new Float32Array(3000 * 3);
    for (let i = 0; i < 3000; i++) { const v = new THREE.Vector3().randomDirection().multiplyScalar(30 + Math.random() * 50); sp.set([v.x, v.y, v.z], i * 3); }
    const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.BufferAttribute(sp, 3));
    this.scene.add(new THREE.Points(sg, new THREE.PointsMaterial({ color: 0xcfd8ff, size: 0.09, sizeAttenuation: true, transparent: true, opacity: 0.85, depthWrite: false })));
    // diplomatic arcs with travelling pulses
    this.arcMats = [];
    ROUTES.forEach(([a, b], i) => {
      const A = ll(...CAP[a]), B = ll(...CAP[b]); const ang = A.angleTo(B); const h = 0.06 + ang * 0.14; const n = 120;
      const pos = new Float32Array(n * 3), u = new Float32Array(n);
      for (let k = 0; k < n; k++) { const t = k / (n - 1); const v = new THREE.Vector3().copy(A).lerp(B, t).normalize().multiplyScalar(1.004 + h * Math.sin(Math.PI * t)); pos.set([v.x, v.y, v.z], k * 3); u[k] = t; }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('u', new THREE.BufferAttribute(u, 1));
      const m = new THREE.ShaderMaterial({
        uniforms: { time: { value: 0 }, draw: { value: 1 }, off: { value: i * 0.137 }, col: { value: new THREE.Color(i % 4 === 3 ? 0x7fd3ff : 0xffcf7a) } },
        transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
        vertexShader: `attribute float u;varying float vU;void main(){vU=u;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
        fragmentShader: `uniform float time,draw,off;uniform vec3 col;varying float vU;void main(){if(vU>draw)discard;float p=exp(-pow((fract(time*.16+off)*1.3-.15-vU)*24.,2.));gl_FragColor=vec4(col*(.55+p*4.),.28+p);}`,
      });
      this.arcMats.push(m); this.globe.add(new THREE.Line(g, m));
    });
    // capitals (soft gold glows) and hotspots (red pulses)
    const glow = glowTexture('rgba(255,215,150,1)');
    Object.values(CAP).forEach(c => { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true })); s.position.copy(ll(...c, 1.008)); s.scale.setScalar(0.05); this.globe.add(s); });
    const red = glowTexture('rgba(255,80,60,1)');
    this.hot = HOT.map(([lo, la], i) => { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: red, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true })); s.position.copy(ll(lo, la, 1.01)); s.userData.ph = i * 0.7; this.globe.add(s); return s; });
    this.resize();
  }
  face(lon, lat) { const v = ll(lon, 0); this.globe.rotation.set(lat * D2R, -Math.atan2(v.x, v.z), 0); }
  update(t, p) {
    this.mat.uniforms.time.value = t;
    let lon, lat, dist, cx, cy, draw;
    if (this.mode === 'hero') {
      const e = ease(clamp(p * 1.05));
      lon = lerp(80, 20, e) - t * 1.2; lat = lerp(8, 16, e);
      dist = lerp(PHONE ? 2.2 : 1.75, PHONE ? 4.4 : 3.3, e);
      cy = lerp(PHONE ? 0.85 : 0.86, PHONE ? 0.4 : 0.0, e); cx = lerp(0, PHONE ? 0 : -0.95, e);
      draw = smooth(0.08, 0.7, p);
    } else { lon = 60 - t * 3; lat = 14; dist = PHONE ? 4.2 : 3.1; cx = 0; cy = PHONE ? -0.15 : 0; draw = 1; }
    this.face(lon, lat);
    this.cam.position.set(cx, cy, dist); this.cam.lookAt(cx, cy, 0);
    this.arcMats.forEach(m => { m.uniforms.time.value = t; m.uniforms.draw.value = draw; });
    this.hot.forEach(s => { const k = (t * 0.5 + s.userData.ph) % 1; s.scale.setScalar(0.03 + k * 0.08); s.material.opacity = (1 - k) * 0.9; });
  }
}

/* ------------------------------------------------------------------ 2 · LIQUID GOLD */
class Gold extends Stage {
  constructor(canvas, key) {
    super(canvas, key, { fov: 32 });
    this.reduceP = 0.4;
    this.scene.background = new THREE.Color(0x0b0806); this.env(0.05);
    this.scene.add(new THREE.HemisphereLight(0xffe2b0, 0x120a04, 0.6));
    const key1 = new THREE.DirectionalLight(0xffe0b0, 5); key1.position.set(-3, 4, 3); this.scene.add(key1);
    const rim = new THREE.DirectionalLight(0xffb060, 2.5); rim.position.set(3, 1, -3); this.scene.add(rim); const fillG = new THREE.DirectionalLight(0xfff2d8, 3); fillG.position.set(2, 0.5, 4); this.scene.add(fillG);
    this.goldMat = new THREE.MeshPhysicalMaterial({ color: 0xffc766, metalness: 1, roughness: 0.2, clearcoat: 1, clearcoatRoughness: 0.05, envMapIntensity: 4 });
    this.mc = new MarchingCubes(PHONE ? 40 : 56, this.goldMat, false, false, 120000); this.mc.scale.setScalar(1.5); this.mc.isolation = 70; this.scene.add(this.mc);
    this.drops = new THREE.InstancedMesh(new THREE.SphereGeometry(0.028, 16, 16), this.goldMat, 42); this.scene.add(this.drops);
    this.dd = Array.from({ length: 42 }, () => ({ p: new THREE.Vector3(0, -9, 0), v: new THREE.Vector3(), life: 0 }));
    this.m4 = new THREE.Matrix4(); this.last = 0; this.resize();
  }
  update(t, p) {
    const mc = this.mc; mc.reset();
    const flow = 1 - smooth(0.62, 0.8, p);
    const N = 20;
    for (let i = 0; i < N; i++) {
      const k = (t * 0.42 + i / N) % 1; if (flow < k * 0.9) continue;
      const y = 0.97 - k * 0.8; const w = Math.sin(t * 2 + i) * 0.012 * k;
      mc.addBall(0.5 + w, y, 0.5 + w * 0.6, 0.075 + 0.05 * k, 12);
    }
    for (let i = 0; i < 7; i++) { const a = t * 0.45 + i * 0.9; const r = 0.06 + (i % 3) * 0.07; mc.addBall(0.5 + Math.cos(a) * r * 1.6, 0.16 + Math.sin(a * 1.7) * 0.02, 0.5 + Math.sin(a) * r, 0.4, 12); }
    mc.update();
    // splash droplets at the impact point
    const dt = Math.min(0.05, t - this.last); this.last = t;
    this.dd.forEach((d, i) => {
      d.life -= dt;
      if (d.life <= 0 && flow > 0.3 && Math.random() < 0.08) { d.life = 0.9 + Math.random() * 0.6; d.p.set(0, -0.6, 0); const a = Math.random() * Math.PI * 2, s = 0.5 + Math.random() * 0.9; d.v.set(Math.cos(a) * s, 1.6 + Math.random() * 1.6, Math.sin(a) * s); }
      if (d.life > 0) { d.v.y -= 6 * dt; d.p.addScaledVector(d.v, dt); if (d.p.y < -0.72) d.life = 0; } else d.p.y = -9;
      const sc = d.life > 0 ? 0.6 + d.life * 0.6 : 0.0001; this.m4.makeScale(sc, sc, sc).setPosition(d.p); this.drops.setMatrixAt(i, this.m4);
    });
    this.drops.instanceMatrix.needsUpdate = true;
    const e = ease(clamp(p));
    this.cam.position.set(lerp(-0.25, 0.35, e), lerp(0.55, -0.05, e), lerp(PHONE ? 4.6 : 3.2, PHONE ? 3.8 : 2.4, e));
    this.cam.lookAt(PHONE ? 0 : 0.7 * (1 - e * 0.8), lerp(0.05, -0.35, e), 0);
  }
}

/* ------------------------------------------------------------------ 3 · BRASS COIN */
function loadImg(src) { return new Promise(r => { const i = new Image(); i.onload = () => r(i); i.onerror = () => r(null); i.src = src; }); }
class Coin extends Stage {
  constructor(canvas, key) {
    super(canvas, key, { alpha: true, fov: 26 });
    this.reduceP = 0;
    this.env(0.045);
    const k = new THREE.DirectionalLight(0xfff0d8, 2.4); k.position.set(-2, 3, 4); this.scene.add(k);
    const r2 = new THREE.DirectionalLight(0xffffff, 1.2); r2.position.set(3, -1, 2); this.scene.add(r2);
    const geo = new THREE.CylinderGeometry(1, 1, 0.12, 160, 1); geo.rotateX(Math.PI / 2);
    this.side = new THREE.MeshStandardMaterial({ color: 0xc8a060, metalness: 1, roughness: 0.28 });
    this.front = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.5, roughness: 0.35 });
    this.back = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 1, roughness: 0.25 });
    this.coin = new THREE.Mesh(geo, [this.side, this.front, this.back]); this.scene.add(this.coin);
    // rim bead
    const rim = new THREE.Mesh(new THREE.TorusGeometry(1, 0.035, 24, 160), this.side); this.coin.add(rim);
    this.build(); this.resize();
  }
  async build() {
    const [seal, mark] = await Promise.all([loadImg('media/yanf-seal-brass.svg'), loadImg('media/yanf-mark-reversed.svg')]);
    const S = 1024; const mk = () => { const c = document.createElement('canvas'); c.width = c.height = S; return [c, c.getContext('2d')]; };
    const tex = (c, srgb) => { const t = new THREE.CanvasTexture(c); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; };
    // front: dark enamel with the brass seal
    const [fc, f] = mk(); const g = f.createRadialGradient(S * .38, S * .32, 20, S / 2, S / 2, S * .55); g.addColorStop(0, '#3b2c1e'); g.addColorStop(1, '#100b07'); f.fillStyle = g; f.fillRect(0, 0, S, S);
    if (seal) f.drawImage(seal, S * .04, S * .04, S * .92, S * .92);
    const [mc, m] = mk(); m.fillStyle = '#202020'; m.fillRect(0, 0, S, S); if (seal) { m.filter = 'brightness(0) invert(1)'; m.drawImage(seal, S * .04, S * .04, S * .92, S * .92); }
    const [rc, rr] = mk(); rr.fillStyle = '#909090'; rr.fillRect(0, 0, S, S); if (seal) { rr.filter = 'brightness(0) invert(.25)'; rr.drawImage(seal, S * .04, S * .04, S * .92, S * .92); }
    Object.assign(this.front, { map: tex(fc, true), metalnessMap: tex(mc), roughnessMap: tex(rc), metalness: 1, roughness: 1 }); this.front.needsUpdate = true;
    // back: polished brass with an engraved mark
    const [bc, b] = mk(); const bg = b.createRadialGradient(S * .35, S * .3, 30, S / 2, S / 2, S * .6); bg.addColorStop(0, '#f6e0a8'); bg.addColorStop(.55, '#c99d52'); bg.addColorStop(1, '#8a6528'); b.fillStyle = bg; b.fillRect(0, 0, S, S);
    b.strokeStyle = 'rgba(80,52,16,.55)'; b.lineWidth = 6; b.beginPath(); b.arc(S / 2, S / 2, S * .44, 0, 7); b.stroke();
    if (mark) { b.save(); b.translate(S, 0); b.scale(-1, 1); b.filter = 'brightness(.22) sepia(1)'; b.drawImage(mark, S * .2, S * .2, S * .6, S * .6); b.restore(); }
    this.back.map = tex(bc, true); this.back.needsUpdate = true;
  }
  onResize(w, h) { this.layout = { w, h }; }
  update(t, p) {
    const { w, h } = this.layout || { w: 1, h: 1 };
    const diam = PHONE ? w * 0.56 : Math.min(w * 0.36, 320);
    const dist = (h * 2 / diam) / (2 * Math.tan(this.cam.fov * D2R / 2));
    const cy = PHONE ? (0.5 - 0.40) * 2 * (dist * Math.tan(this.cam.fov * D2R / 2)) : (0.5 - 0.48) * 2 * (dist * Math.tan(this.cam.fov * D2R / 2));
    this.cam.position.set(0, cy, dist); this.cam.lookAt(0, cy, 0);
    this.coin.rotation.y = p * Math.PI * 2 * 3 + (REDUCE ? 0 : Math.sin(t * 0.5) * 0.25);
    this.coin.rotation.x = Math.sin(t * 0.6) * 0.18 - 0.1;
    this.coin.position.y = REDUCE ? 0 : Math.sin(t * 0.9) * 0.05;
  }
}

/* ------------------------------------------------------------------ 4 · DUSK SEA + WIND FARM */
const SKY = `
vec3 sky(vec3 d, vec3 sun){
  float y=d.y; vec3 hor=vec3(1.0,.52,.26), mid=vec3(.62,.24,.32), up=vec3(.16,.12,.32), top=vec3(.025,.035,.11);
  vec3 c=mix(hor,mid,smoothstep(0.,.1,y)); c=mix(c,up,smoothstep(.08,.32,y)); c=mix(c,top,smoothstep(.3,.85,y));
  if(y<0.) c=mix(hor*.6,vec3(.05,.04,.08),smoothstep(0.,-.2,y));
  float s=max(dot(d,sun),0.); c+=vec3(1.,.55,.25)*pow(s,10.)*.7+vec3(1.,.82,.55)*pow(s,1400.)*40.;
  return c;}`;
class Dusk extends Stage {
  constructor(canvas, key) {
    super(canvas, key, { bloom: [0.3, 0.4, 0.9], fov: 40, far: 3000 });
    this.reduceP = 0.4;
    this.sun = new THREE.Vector3(0, 0.035, -1).normalize();
    const horizon = new THREE.Color(0.36, 0.16, 0.13);
    this.scene.fog = new THREE.Fog(horizon, 200, 2400);
    this.scene.add(new THREE.Mesh(new THREE.SphereGeometry(2000, 64, 32), new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false, fog: false, uniforms: { sun: { value: this.sun } },
      vertexShader: `varying vec3 vD;void main(){vD=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
      fragmentShader: `uniform vec3 sun;varying vec3 vD;${SKY}void main(){gl_FragColor=vec4(sky(normalize(vD),sun),1.);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
    })));
    const sg = new THREE.PlaneGeometry(3000, 3000, PHONE ? 160 : 260, PHONE ? 160 : 260); sg.rotateX(-Math.PI / 2);
    this.sea = new THREE.ShaderMaterial({
      uniforms: { time: { value: 0 }, sun: { value: this.sun }, hor: { value: horizon } }, fog: false,
      vertexShader: `uniform float time;varying vec3 vW;varying vec3 vN;
        vec3 wave(vec2 p){float h=0.,dx=0.,dz=0.;
          vec4 W[5];W[0]=vec4(.8,.2,.045,.9);W[1]=vec4(-.4,.9,.07,1.3);W[2]=vec4(.3,-.95,.11,1.7);W[3]=vec4(.95,.3,.19,2.3);W[4]=vec4(-.7,-.7,.29,2.9);
          float A[5];A[0]=.9;A[1]=.5;A[2]=.28;A[3]=.14;A[4]=.07;
          for(int i=0;i<5;i++){vec2 d=normalize(W[i].xy);float k=W[i].z;float ph=dot(d,p)*k+time*W[i].w;h+=A[i]*sin(ph);float c=A[i]*k*cos(ph);dx+=c*d.x;dz+=c*d.y;}
          return vec3(h,dx,dz);}
        void main(){vec3 p=position;vec3 w=wave(p.xz);p.y+=w.x;vN=normalize(vec3(-w.y,1.,-w.z));vec4 ww=modelMatrix*vec4(p,1.);vW=ww.xyz;gl_Position=projectionMatrix*viewMatrix*ww;}`,
      fragmentShader: `uniform vec3 sun;uniform vec3 hor;varying vec3 vW;varying vec3 vN;${SKY}
        void main(){vec3 N=normalize(vN);vec3 V=normalize(cameraPosition-vW);vec3 R=reflect(-V,N);R.y=abs(R.y);
          float f=.02+.98*pow(1.-max(dot(N,V),0.),5.);vec3 c=mix(vec3(.008,.012,.03),sky(R,sun),f);
          c+=vec3(1.,.7,.4)*pow(max(dot(R,sun),0.),350.)*14.;
          float dist=length(vW.xz-cameraPosition.xz);c=mix(c,hor,1.-exp(-dist*.0011));
          gl_FragColor=vec4(c,1.);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`,
    });
    this.scene.add(new THREE.Mesh(sg, this.sea));
    this.scene.add(new THREE.HemisphereLight(0xffa070, 0x0a0c18, 0.55));
    const sl = new THREE.DirectionalLight(0xffb070, 2.2); sl.position.set(0, 20, -400); this.scene.add(sl);
    const fill = new THREE.DirectionalLight(0x6070c0, 0.35); fill.position.set(50, 60, 200); this.scene.add(fill);
    const mat = new THREE.MeshStandardMaterial({ color: 0x4a4e5e, roughness: 0.5, metalness: 0.4 });
    const tower = new THREE.CylinderGeometry(0.9, 1.7, 90, 20); tower.translate(0, 45, 0);
    const nac = new THREE.BoxGeometry(4.5, 4, 11); const hub = new THREE.SphereGeometry(2.1, 20, 20);
    const blade = new THREE.BoxGeometry(2.2, 46, 0.5); blade.translate(0, 23, 0);
    this.rotors = [];
    const spots = []; for (let r = 0; r < 7; r++) for (let c = -4; c <= 4; c++) { if ((r + c) % 2) continue; spots.push([c * 95 + r * 30 + (r % 2) * 40, -180 - r * 150]); }
    spots.push([-48, -95]);
    spots.forEach(([x, z], i) => {
      const g = new THREE.Group(); g.position.set(x, -1, z);
      g.add(new THREE.Mesh(tower, mat)); const n = new THREE.Mesh(nac, mat); n.position.set(0, 91, 2); g.add(n);
      const rotor = new THREE.Group(); rotor.position.set(0, 91, 8.2); rotor.add(new THREE.Mesh(hub, mat));
      for (let b = 0; b < 3; b++) { const bl = new THREE.Mesh(blade, mat); bl.rotation.z = b * Math.PI * 2 / 3; rotor.add(bl); }
      rotor.userData.sp = 0.5 + (i % 5) * 0.06; rotor.userData.ph = i; g.add(rotor); this.rotors.push(rotor); g.rotation.y = 0.15; this.scene.add(g);
    });
    this.resize();
  }
  update(t, p) {
    this.sea.uniforms.time.value = t;
    this.rotors.forEach(r => (r.rotation.z = t * r.userData.sp + r.userData.ph));
    const e = ease(clamp(p));
    this.cam.position.set(lerp(-30, 10, e), lerp(9, 16, e), lerp(140, 40, e));
    this.cam.lookAt(lerp(-20, 30, e), lerp(32, 42, e), -400);
  }
}

/* ------------------------------------------------------------------ 5 · ENERGY VIGNETTES */
class Energy extends Stage {
  constructor(canvas, key) {
    super(canvas, key, { bloom: [0.6, 0.45, 0.55], fov: 38 });
    this.reduceP = 0.1;
    this.scene.background = new THREE.Color(0x04060b); this.scene.fog = new THREE.FogExp2(0x04060b, 0.035); this.env(0.03);
    this.scene.add(new THREE.HemisphereLight(0x9fc4ff, 0x05070c, 0.4));
    const kl = new THREE.DirectionalLight(0xffffff, 2); kl.position.set(-3, 5, 6); this.scene.add(kl);
    // — Atom
    const atom = (this.atom = new THREE.Group()); this.scene.add(atom);
    const nuc = new THREE.InstancedMesh(new THREE.SphereGeometry(0.3, 32, 32), new THREE.MeshPhysicalMaterial({ roughness: 0.15, clearcoat: 1, metalness: 0.1 }), 16);
    const m = new THREE.Matrix4(), col = new THREE.Color();
    for (let i = 0; i < 16; i++) { const v = new THREE.Vector3().randomDirection().multiplyScalar(Math.cbrt(Math.random()) * 0.42); m.makeTranslation(v.x, v.y, v.z); nuc.setMatrixAt(i, m); nuc.setColorAt(i, col.set(i % 2 ? 0xe2533f : 0xf3e7cf)); }
    atom.add(nuc);
    const core = new THREE.PointLight(0xff9a60, 2, 4); atom.add(core);
    this.orbits = [];
    [[0.3, 0], [1.1, 1.1], [-0.9, 2.1]].forEach(([tx, ty], i) => {
      const o = new THREE.Group(); o.rotation.set(tx + Math.PI / 2, ty, 0); atom.add(o);
      o.add(new THREE.Mesh(new THREE.TorusGeometry(2.2, 0.008, 8, 200), new THREE.MeshBasicMaterial({ color: new THREE.Color(0.35, 0.9, 1.6), transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false })));
      const e = new THREE.Mesh(new THREE.SphereGeometry(0.06, 16, 16), new THREE.MeshBasicMaterial({ color: new THREE.Color(1.6, 2.6, 3.2) })); o.add(e);
      const trail = new THREE.Line(new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(new Float32Array(40 * 3), 3)).setAttribute('color', new THREE.BufferAttribute(new Float32Array(40 * 3), 3)),
        new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
      o.add(trail); this.orbits.push({ e, trail, ph: i * 2.1, sp: 1.4 + i * 0.35 });
    });
    // — Water (ripples from a falling drop)
    const water = (this.water = new THREE.Group()); water.position.x = 60; this.scene.add(water);
    const wg = new THREE.PlaneGeometry(30, 30, 1, 1); wg.rotateX(-Math.PI / 2);
    this.wmat = new THREE.ShaderMaterial({
      uniforms: { time: { value: 0 } }, fog: false,
      vertexShader: `varying vec3 vW;varying vec2 vP;void main(){vP=position.xz;vec4 w=modelMatrix*vec4(position,1.);vW=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}`,
      fragmentShader: `uniform float time;varying vec3 vW;varying vec2 vP;
        float h(vec2 p){float T=3.2;float ph=mod(time,T)-.75;if(ph<0.)ph+=T;float r=length(p);
          float a=sin(r*7.-ph*9.)*exp(-r*.45)*exp(-ph*.55)*smoothstep(ph*2.6+.2,ph*2.6-.4,r);
          float ph2=ph+T;float b=sin(r*7.-ph2*9.)*exp(-r*.45)*exp(-ph2*.55)*.6;return (a+b)*.12;}
        void main(){float e=.03;float hx=h(vP+vec2(e,0))-h(vP-vec2(e,0));float hz=h(vP+vec2(0,e))-h(vP-vec2(0,e));vec3 N=normalize(vec3(-hx/(2.*e),1.,-hz/(2.*e)));
          vec3 V=normalize(cameraPosition-vW);vec3 R=reflect(-V,N);float f=.04+.96*pow(1.-max(dot(N,V),0.),5.);
          vec3 env=mix(vec3(.01,.06,.08),vec3(.35,.85,.95),smoothstep(-.1,.8,R.y));env+=vec3(1.)*pow(max(dot(R,normalize(vec3(-.4,.7,-.6))),0.),220.)*6.;
          vec3 c=mix(vec3(.003,.03,.04),env,f);float d=length(vP);c*=smoothstep(14.,4.,d);
          gl_FragColor=vec4(c,1.);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`,
    });
    water.add(new THREE.Mesh(wg, this.wmat));
    this.drop = new THREE.Mesh(new THREE.SphereGeometry(0.14, 32, 32), new THREE.MeshPhysicalMaterial({ color: 0xbff4ff, transmission: 1, roughness: 0.02, thickness: 0.4, ior: 1.33 })); water.add(this.drop);
    // — Crude (black glossy metaballs)
    const crude = (this.crude = new THREE.Group()); crude.position.x = 120; this.scene.add(crude);
    this.oil = new MarchingCubes(PHONE ? 32 : 44, new THREE.MeshPhysicalMaterial({ color: 0x050403, metalness: 0.2, roughness: 0.06, clearcoat: 1, clearcoatRoughness: 0.02, envMapIntensity: 2.2 }), false, false, 80000);
    this.oil.scale.setScalar(2.1); this.oil.isolation = 60; crude.add(this.oil);
    const gl1 = new THREE.PointLight(0xffb050, 6, 10); gl1.position.set(2.5, 1.5, 2); crude.add(gl1);
    // — Signal (undersea cables)
    const sig = (this.sig = new THREE.Group()); sig.position.x = 180; this.scene.add(sig);
    const floor = new THREE.PlaneGeometry(60, 60, 1, 1); floor.rotateX(-Math.PI / 2);
    sig.add(new THREE.Mesh(floor, new THREE.ShaderMaterial({ fog: false,
      vertexShader: `varying vec3 vW;varying vec2 vP;void main(){vP=position.xz;vec4 w=modelMatrix*vec4(position,1.);vW=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}`,
      fragmentShader: `varying vec3 vW;varying vec2 vP;${NOISE}void main(){float n=fbm(vec3(vP*.6,0.));float r=sin(vP.x*3.+n*6.)*.5+.5;vec3 c=mix(vec3(.01,.025,.03),vec3(.04,.09,.1),n*.8+r*.2);
        float d=length(vW-cameraPosition);c=mix(c,vec3(.0,.02,.035),1.-exp(-d*.06));gl_FragColor=vec4(c,1.);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }` })));
    this.cmats = [];
    for (let i = 0; i < 5; i++) {
      const pts = []; for (let k = 0; k <= 8; k++) pts.push(new THREE.Vector3(-6 + i * 2.4 + Math.sin(k * 0.9 + i) * 1.2 + k * (i - 2) * 0.5, 0.25, 8 - k * 4));
      const cm = new THREE.ShaderMaterial({ uniforms: { time: { value: 0 }, off: { value: i * 0.21 } }, fog: false,
        vertexShader: `varying vec2 vUv;varying vec3 vN;varying vec3 vW;void main(){vUv=uv;vN=normalize(mat3(modelMatrix)*normal);vec4 w=modelMatrix*vec4(position,1.);vW=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}`,
        fragmentShader: `uniform float time,off;varying vec2 vUv;varying vec3 vN;varying vec3 vW;void main(){vec3 V=normalize(cameraPosition-vW);float l=max(dot(normalize(vN),normalize(vec3(-.3,1.,.4))),0.);
          vec3 c=vec3(.03,.04,.05)*(.4+l)+vec3(.05,.12,.12)*pow(1.-max(dot(normalize(vN),V),0.),2.);
          float x=fract(vUv.x*4.-time*.45+off);float p=exp(-pow((x-.5)*26.,2.));c+=vec3(.25,1.4,1.1)*p*4.+vec3(.02,.12,.1);
          float d=length(vW-cameraPosition);c=mix(c,vec3(0.,.02,.035),1.-exp(-d*.05));gl_FragColor=vec4(c,1.);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }` });
      this.cmats.push(cm); sig.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 160, 0.22, 16), cm));
    }
    const pg = new Float32Array(600 * 3); for (let i = 0; i < 600; i++) pg.set([(Math.random() - .5) * 24, Math.random() * 7, 6 - Math.random() * 30], i * 3);
    const pgeo = new THREE.BufferGeometry(); pgeo.setAttribute('position', new THREE.BufferAttribute(pg, 3));
    this.plankton = new THREE.Points(pgeo, new THREE.PointsMaterial({ color: 0x9fe8ff, size: 0.05, transparent: true, opacity: 0.7, blending: THREE.AdditiveBlending, depthWrite: false })); sig.add(this.plankton);
    this.cams = [
      { p: [0, 0.7, 7], l: [0, 0, 0] }, { p: [60, 3.6, 7.5], l: [60, -0.4, 0] }, { p: [120, 0.9, 6], l: [120, 0, 0] }, { p: [180, 2.6, 8.5], l: [180, 0.2, -4] },
    ];
    this.resize();
  }
  update(t, p) {
    const s = p * 4.6; let v = 0; for (let i = 1; i < 4; i++) v += smooth(i + 0.25, i + 0.75, s);
    const i0 = Math.min(2, Math.floor(v)), k = v - i0; const A = this.cams[i0], B = this.cams[Math.min(3, i0 + 1)];
    const off = PHONE ? 0 : -2.2; const sway = REDUCE ? 0 : Math.sin(t * 0.3) * 0.4;
    this.cam.position.set(lerp(A.p[0], B.p[0], k) + sway, lerp(A.p[1], B.p[1], k), lerp(A.p[2], B.p[2], k));
    this.cam.lookAt(lerp(A.l[0], B.l[0], k) + off, lerp(A.l[1], B.l[1], k), lerp(A.l[2], B.l[2], k));
    const near = j => Math.abs(v - j) < 1.2;
    if (near(0)) {
      this.atom.rotation.y = t * 0.25; this.atom.rotation.x = Math.sin(t * 0.2) * 0.3;
      this.orbits.forEach(o => {
        const a = t * o.sp + o.ph; o.e.position.set(Math.cos(a) * 2.2, Math.sin(a) * 2.2, 0);
        const pos = o.trail.geometry.attributes.position, colr = o.trail.geometry.attributes.color;
        for (let j = 0; j < 40; j++) { const b = a - j * 0.04; pos.setXYZ(j, Math.cos(b) * 2.2, Math.sin(b) * 2.2, 0); const f = 1 - j / 40; colr.setXYZ(j, 0.4 * f * f * 2, 1.4 * f * f * 2, 2 * f * f * 2); }
        pos.needsUpdate = colr.needsUpdate = true;
      });
    }
    if (near(1)) { this.wmat.uniforms.time.value = t; const ph = t % 3.2; this.drop.position.set(0, ph < 0.75 ? 4 - ph * ph * 7.1 : -5, 0); }
    if (near(2)) {
      const o = this.oil; o.reset();
      for (let i = 0; i < 7; i++) { const a = t * (0.35 + i * 0.05) + i * 1.7; o.addBall(0.5 + Math.cos(a) * 0.22, 0.5 + Math.sin(a * 1.3) * 0.18, 0.5 + Math.sin(a * 0.7) * 0.18, 0.55, 12); }
      o.update(); this.crude.rotation.y = t * 0.1;
    }
    if (near(3)) { this.cmats.forEach(m => (m.uniforms.time.value = t)); this.plankton.rotation.y = Math.sin(t * 0.05) * 0.1; this.plankton.position.y = Math.sin(t * 0.3) * 0.15; }
  }
}

/* ------------------------------------------------------------------ 2D generative panels (cards, editorial, triptych) */
const LAND = [];
fetch('media/landdots.json').then(r => r.json()).then(a => { for (let i = 0; i < a.length; i += 2) LAND.push([a[i], a[i + 1]]); }).catch(() => {});
const painters = {
  // vaulted hall of waving flags, one-point perspective
  flags(g, w, h, t) {
    const bg = g.createLinearGradient(0, 0, 0, h); bg.addColorStop(0, '#1d140d'); bg.addColorStop(.55, '#4a3322'); bg.addColorStop(1, '#140e09'); g.fillStyle = bg; g.fillRect(0, 0, w, h);
    const cx = w / 2, cy = h * 0.46;
    const lg = g.createRadialGradient(cx, cy, 0, cx, cy, w * 0.5); lg.addColorStop(0, 'rgba(255,226,170,.85)'); lg.addColorStop(.2, 'rgba(255,190,120,.25)'); lg.addColorStop(1, 'rgba(255,190,120,0)'); g.fillStyle = lg; g.fillRect(0, 0, w, h);
    g.strokeStyle = 'rgba(232,200,150,.18)'; g.lineWidth = 2;
    for (let k = 0; k < 9; k++) { const s = 1 / (1 + k * 0.55); g.beginPath(); g.ellipse(cx, cy + h * 0.1 * s, w * 0.55 * s, h * 0.75 * s, 0, Math.PI, 2 * Math.PI); g.stroke(); }
    const PAL = [['#ff9933', '#ffffff', '#138808'], ['#002395', '#ffffff', '#ed2939'], ['#000000', '#dd0000', '#ffce00'], ['#009246', '#ffffff', '#ce2b37'], ['#0055a4', '#ffd700', '#0055a4'], ['#d52b1e', '#ffffff', '#d52b1e'], ['#007a3d', '#ffffff', '#000000'], ['#ffffff', '#bc002d', '#ffffff'], ['#00247d', '#cf142b', '#ffffff'], ['#3a75c4', '#ffffff', '#3a75c4'], ['#ce1126', '#ffffff', '#00843d'], ['#fcd116', '#003893', '#ce1126']];
    for (let k = 13; k >= 0; k--) {
      const z = 1 + k * 0.42, s = 1 / z;
      for (const side of [-1, 1]) {
        const px = cx + side * w * 0.47 * s, py = cy - h * 0.36 * s; const fw = w * 0.2 * s, fh = h * 0.24 * s; const pal = PAL[(k * 2 + (side > 0 ? 1 : 0)) % PAL.length];
        g.strokeStyle = `rgba(210,190,150,${0.7 * s + 0.2})`; g.lineWidth = Math.max(1, 3 * s); g.beginPath(); g.moveTo(px, py); g.lineTo(px - side * fw * 0.95, py + fh * 0.35); g.stroke();
        const N = 14;
        for (let j = 0; j < N; j++) {
          const u0 = j / N, u1 = (j + 1) / N;
          const wv = a => Math.sin(t * 2.2 + k * 0.7 + a * 5) * fh * 0.12 * a;
          const x0 = px - side * fw * 0.95 * u0, x1 = px - side * fw * 0.95 * u1; const y0 = py + fh * 0.35 * u0 + wv(u0), y1 = py + fh * 0.35 * u1 + wv(u1);
          const shade = 0.65 + 0.35 * Math.cos(t * 2.2 + k * 0.7 + u0 * 5);
          for (let b = 0; b < 3; b++) {
            g.fillStyle = pal[b]; g.globalAlpha = 0.95;
            g.beginPath(); g.moveTo(x0, y0 + fh * b / 3); g.lineTo(x1, y1 + fh * b / 3); g.lineTo(x1, y1 + fh * (b + 1) / 3); g.lineTo(x0, y0 + fh * (b + 1) / 3); g.closePath(); g.fill();
          }
          g.globalAlpha = 1 - shade; g.fillStyle = '#000'; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.lineTo(x1, y1 + fh); g.lineTo(x0, y0 + fh); g.closePath(); g.fill(); g.globalAlpha = 1;
        }
        g.fillStyle = `rgba(20,12,6,${0.55 * (1 - s)})`; g.fillRect(Math.min(px, px - side * fw), py - 4, fw, fh * 1.5);
      }
    }
    const fl = g.createLinearGradient(0, cy, 0, h); fl.addColorStop(0, 'rgba(70,48,30,0)'); fl.addColorStop(1, 'rgba(20,14,9,.9)'); g.fillStyle = fl; g.fillRect(0, cy, w, h - cy);
  },
  // two lecterns, a spotlight each, an argument as waveform
  debate(g, w, h, t) {
    const bg = g.createLinearGradient(0, 0, 0, h); bg.addColorStop(0, '#2a0806'); bg.addColorStop(1, '#0d0302'); g.fillStyle = bg; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 18; i++) { const x = i / 18 * w; const cg = g.createLinearGradient(x, 0, x + w / 18, 0); cg.addColorStop(0, 'rgba(0,0,0,.35)'); cg.addColorStop(.5, 'rgba(150,30,20,.18)'); cg.addColorStop(1, 'rgba(0,0,0,.35)'); g.fillStyle = cg; g.fillRect(x, 0, w / 18, h); }
    const turn = Math.sin(t * 0.8) > 0 ? 0 : 1;
    [[0.2, 0], [0.8, 1]].forEach(([fx, i]) => {
      const x = w * fx, on = turn === i; const sg = g.createRadialGradient(x, h * 0.62, 0, x, h * 0.62, h * 0.55); sg.addColorStop(0, `rgba(255,220,170,${on ? .55 : .18})`); sg.addColorStop(1, 'rgba(255,220,170,0)'); g.fillStyle = sg; g.fillRect(0, 0, w, h);
      g.fillStyle = `rgba(255,230,190,${on ? .12 : .05})`; g.beginPath(); g.moveTo(x - 10, 0); g.lineTo(x + 10, 0); g.lineTo(x + w * 0.13, h); g.lineTo(x - w * 0.13, h); g.fill();
      g.fillStyle = '#1a0d07'; g.beginPath(); g.moveTo(x - w * 0.07, h * 0.62); g.lineTo(x + w * 0.07, h * 0.62); g.lineTo(x + w * 0.055, h); g.lineTo(x - w * 0.055, h); g.fill();
      g.fillStyle = '#c8a264'; g.fillRect(x - w * 0.075, h * 0.6, w * 0.15, h * 0.025);
      g.strokeStyle = '#9a9a9a'; g.lineWidth = 3; g.beginPath(); g.moveTo(x, h * 0.6); g.quadraticCurveTo(x + (i ? -1 : 1) * w * 0.02, h * 0.5, x + (i ? -1 : 1) * w * 0.035, h * 0.46); g.stroke();
      g.fillStyle = '#2c2c2c'; g.beginPath(); g.ellipse(x + (i ? -1 : 1) * w * 0.037, h * 0.455, 6, 10, 0, 0, 7); g.fill();
    });
    const N = 64; const bw = w * 0.5 / N;
    for (let k = 0; k < N; k++) {
      const u = k / (N - 1); const side = turn === 0 ? 1 - u : u;
      const a = (Math.abs(Math.sin(t * 6 + k * 0.6) * Math.sin(t * 2.3 + k * 0.21)) * 0.8 + 0.08) * (0.25 + side * 0.75);
      const x = w * 0.25 + k * bw, hh = a * h * 0.28;
      const gg = g.createLinearGradient(0, h * 0.5 - hh, 0, h * 0.5 + hh); gg.addColorStop(0, 'rgba(255,214,140,.1)'); gg.addColorStop(.5, 'rgba(255,214,140,.95)'); gg.addColorStop(1, 'rgba(255,214,140,.1)');
      g.fillStyle = gg; g.fillRect(x, h * 0.5 - hh, bw * 0.55, hh * 2);
    }
  },
  // hemicycle from above, seats lighting in voting waves
  hemicycle(g, w, h, t) {
    g.fillStyle = '#0d0905'; g.fillRect(0, 0, w, h);
    const cx = w / 2, cy = h * 0.86, R = Math.min(w * 0.46, h * 0.82);
    const cg = g.createRadialGradient(cx, cy, 0, cx, cy, R); cg.addColorStop(0, '#2d4a2f'); cg.addColorStop(1, '#122016'); g.fillStyle = cg; g.beginPath(); g.moveTo(cx, cy); g.arc(cx, cy, R, Math.PI, 2 * Math.PI); g.fill();
    for (let r = 0; r < 8; r++) {
      const rr = R * (0.28 + r * 0.09); const n = Math.floor(rr / 9);
      g.strokeStyle = 'rgba(200,162,100,.28)'; g.lineWidth = 3; g.beginPath(); g.arc(cx, cy, rr - 6, Math.PI + .08, 2 * Math.PI - .08); g.stroke();
      for (let j = 0; j < n; j++) {
        const a = Math.PI + 0.1 + (Math.PI - 0.2) * (j + 0.5) / n; const x = cx + Math.cos(a) * rr, y = cy + Math.sin(a) * rr;
        const wave = Math.sin(t * 1.4 - a * 3 + r * 0.5); const on = wave > 0.2; const aye = j / n < 0.55;
        g.fillStyle = on ? (aye ? '#ffd27a' : '#7fd3a0') : '#2e4a34';
        if (on) { g.shadowColor = g.fillStyle; g.shadowBlur = 10; }
        g.save(); g.translate(x, y); g.rotate(a + Math.PI / 2); g.fillRect(-4, -3, 8, 6); g.restore(); g.shadowBlur = 0;
      }
    }
    g.fillStyle = '#c8a264'; g.fillRect(cx - R * 0.12, cy - R * 0.08, R * 0.24, R * 0.06);
    const sp = g.createRadialGradient(cx, cy - R * 0.2, 0, cx, cy - R * 0.2, R * 0.6); sp.addColorStop(0, 'rgba(255,230,180,.18)'); sp.addColorStop(1, 'rgba(255,230,180,0)'); g.fillStyle = sp; g.fillRect(0, 0, w, h);
  },
  // a stage, a rising chart, bokeh
  pitch(g, w, h, t) {
    const bg = g.createLinearGradient(0, 0, 0, h); bg.addColorStop(0, '#0a0a18'); bg.addColorStop(1, '#030308'); g.fillStyle = bg; g.fillRect(0, 0, w, h);
    const sx = w * 0.18, sy = h * 0.12, sw = w * 0.64, sh = h * 0.5; g.fillStyle = '#0c1424'; g.fillRect(sx, sy, sw, sh); g.strokeStyle = 'rgba(120,180,255,.35)'; g.lineWidth = 2; g.strokeRect(sx, sy, sw, sh);
    const ph = (t * 0.25) % 1.3; const n = 9;
    for (let i = 0; i < n; i++) { const v = (0.2 + i / n * 0.75 + Math.sin(i * 2.1) * 0.06) * Math.min(1, ph * 1.6); const bh = v * sh * 0.8; g.fillStyle = i === n - 1 ? '#f2b632' : 'rgba(140,170,255,.55)'; g.fillRect(sx + sw * 0.08 + i * sw * 0.095, sy + sh * 0.9 - bh, sw * 0.06, bh); }
    g.strokeStyle = '#6ef0b0'; g.lineWidth = 3; g.shadowColor = '#6ef0b0'; g.shadowBlur = 16; g.beginPath();
    for (let i = 0; i <= 40; i++) { const u = i / 40; if (u > ph * 1.2) break; const y = sy + sh * (0.85 - u * 0.65 - Math.sin(u * 9) * 0.04); const x = sx + sw * (0.06 + u * 0.88); i ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke(); g.shadowBlur = 0;
    const sp = g.createRadialGradient(w * 0.5, h * 0.9, 0, w * 0.5, h * 0.9, h * 0.5); sp.addColorStop(0, 'rgba(255,225,170,.5)'); sp.addColorStop(1, 'rgba(255,225,170,0)'); g.fillStyle = sp; g.fillRect(0, 0, w, h);
    g.fillStyle = '#05050a'; g.beginPath(); g.ellipse(w * 0.5, h * 0.98, w * 0.3, h * 0.06, 0, 0, 7); g.fill();
    g.fillStyle = '#000'; g.beginPath(); g.arc(w * 0.5, h * 0.71, h * 0.045, 0, 7); g.fill(); g.beginPath(); g.moveTo(w * 0.47, h * 0.97); g.quadraticCurveTo(w * 0.5, h * 0.74, w * 0.53, h * 0.97); g.fill();
    for (let i = 0; i < 40; i++) { const x = (Math.sin(i * 91.7) * 0.5 + 0.5) * w, y = h - ((t * 20 * (0.5 + (i % 5) * 0.2) + i * 37) % (h * 1.1)); const r = 2 + (i % 4) * 2; g.fillStyle = `rgba(255,${200 + (i % 3) * 20},140,${0.08 + (i % 4) * 0.05})`; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); }
  },
  // a large dotted globe in gold on UN blue
  dotglobe(g, w, h, t) {
    const bg = g.createRadialGradient(w * 0.35, h * 0.5, 0, w * 0.35, h * 0.5, Math.max(w, h)); bg.addColorStop(0, '#173a73'); bg.addColorStop(1, '#050d1e'); g.fillStyle = bg; g.fillRect(0, 0, w, h);
    const cx = w * (w < 760 ? 0.5 : 0.36), cy = h * 0.52, R = Math.min(w, h) * 0.42; const rot = t * 6;
    g.strokeStyle = 'rgba(233,199,123,.25)'; g.lineWidth = 1; g.beginPath(); g.arc(cx, cy, R, 0, 7); g.stroke();
    for (let k = 0; k < 3; k++) { g.beginPath(); g.ellipse(cx, cy, R * (1.25 + k * 0.18), R * (0.28 + k * 0.05), -0.35 + k * 0.1, 0, 7); g.strokeStyle = `rgba(233,199,123,${0.22 - k * 0.05})`; g.stroke(); }
    for (const [lon, lat] of LAND) {
      const l = (lon + rot) * D2R, p = lat * D2R, tilt = 0.35; const x = Math.cos(p) * Math.sin(l), y0 = Math.sin(p), z0 = Math.cos(p) * Math.cos(l);
      const y = y0 * Math.cos(tilt) - z0 * Math.sin(tilt), z = y0 * Math.sin(tilt) + z0 * Math.cos(tilt); if (z < 0) continue;
      g.fillStyle = `rgba(240,210,140,${0.25 + z * 0.75})`; g.fillRect(cx + x * R, cy - y * R, 1.6 + z * 1.4, 1.6 + z * 1.4);
    }
    const ang = t * 0.9; const ex = cx + Math.cos(ang) * R * 1.25, ey = cy + Math.sin(ang) * R * 0.28; g.fillStyle = '#ffe2a0'; g.shadowColor = '#ffe2a0'; g.shadowBlur = 18; g.beginPath(); g.arc(ex, ey, 4, 0, 7); g.fill(); g.shadowBlur = 0;
  },
  // sparks rising over a dawn horizon
  sparks(g, w, h, t) {
    const bg = g.createLinearGradient(0, 0, 0, h); bg.addColorStop(0, '#140a1e'); bg.addColorStop(.6, '#5a2140'); bg.addColorStop(.82, '#e2733a'); bg.addColorStop(1, '#ffd08a'); g.fillStyle = bg; g.fillRect(0, 0, w, h);
    const sx = w * 0.62, sy = h * 0.86; const sg = g.createRadialGradient(sx, sy, 0, sx, sy, h * 0.5); sg.addColorStop(0, 'rgba(255,240,200,1)'); sg.addColorStop(.12, 'rgba(255,220,160,.8)'); sg.addColorStop(1, 'rgba(255,200,140,0)'); g.fillStyle = sg; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 160; i++) {
      const s = (i * 0.618) % 1, sp = 0.4 + (i % 7) * 0.1; const y = h - ((t * 40 * sp + i * 53) % (h * 1.2)); const x = (s * w + Math.sin(t * 0.7 + i) * 30);
      const a = Math.max(0, Math.min(1, y / h)); g.fillStyle = i % 5 ? `rgba(255,${190 + (i % 4) * 15},120,${a * 0.8})` : `rgba(120,230,220,${a * 0.7})`; g.beginPath(); g.arc(x, y, 1 + (i % 3), 0, 7); g.fill();
    }
    g.fillStyle = '#0b0610'; g.beginPath(); g.moveTo(0, h); for (let x = 0; x <= w; x += 20) g.lineTo(x, h * 0.9 + Math.sin(x * 0.01) * 10 + Math.sin(x * 0.033) * 6); g.lineTo(w, h); g.fill();
  },
  // round negotiating table, chairs turning
  roundtable(g, w, h, t) {
    g.fillStyle = '#3a2516'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 18; i++) { g.fillStyle = i % 2 ? 'rgba(0,0,0,.12)' : 'rgba(255,220,170,.04)'; g.fillRect(0, i * h / 18, w, h / 18); }
    const cx = w / 2, cy = h / 2, R = Math.min(w, h) * 0.3; g.save(); g.translate(cx, cy); g.rotate(t * 0.08);
    for (let k = 0; k < 12; k++) { const a = k / 12 * Math.PI * 2; g.save(); g.rotate(a); g.translate(0, -R * 1.42); g.fillStyle = '#1b120b'; g.beginPath(); g.roundRect ? g.roundRect(-R * .17, -R * .14, R * .34, R * .28, 8) : g.rect(-R * .17, -R * .14, R * .34, R * .28); g.fill(); g.restore(); }
    g.fillStyle = '#c8a264'; g.beginPath(); g.arc(0, 0, R * 1.08, 0, 7); g.fill(); const tg = g.createRadialGradient(-R * .3, -R * .3, 0, 0, 0, R); tg.addColorStop(0, '#5a3a22'); tg.addColorStop(1, '#2a1a0e'); g.fillStyle = tg; g.beginPath(); g.arc(0, 0, R, 0, 7); g.fill();
    for (let k = 0; k < 12; k++) { const a = k / 12 * Math.PI * 2; g.save(); g.rotate(a); g.translate(0, -R * 0.8); g.fillStyle = '#fffdf6'; g.fillRect(-R * .12, -R * .05, R * .24, R * .1); g.restore(); }
    g.strokeStyle = '#c8a264'; g.lineWidth = 2; g.beginPath(); g.arc(0, 0, R * 0.25, 0, 7); g.stroke(); g.restore();
    const lg = g.createRadialGradient(cx, cy, 0, cx, cy, Math.max(w, h) * 0.7); lg.addColorStop(0, 'rgba(255,230,180,.15)'); lg.addColorStop(1, 'rgba(0,0,0,.55)'); g.fillStyle = lg; g.fillRect(0, 0, w, h);
  },
  // a sapling growing and swaying
  sapling(g, w, h, t) {
    const bg = g.createLinearGradient(0, 0, 0, h); bg.addColorStop(0, '#f5efe2'); bg.addColorStop(1, '#e3d8bf'); g.fillStyle = bg; g.fillRect(0, 0, w, h);
    const sun = g.createRadialGradient(w * 0.72, h * 0.2, 0, w * 0.72, h * 0.2, w * 0.4); sun.addColorStop(0, 'rgba(255,200,120,.55)'); sun.addColorStop(1, 'rgba(255,200,120,0)'); g.fillStyle = sun; g.fillRect(0, 0, w, h);
    g.fillStyle = '#5b4026'; g.fillRect(0, h * 0.84, w, h * 0.16);
    const grow = Math.min(1, (t % 14) / 7);
    const branch = (x, y, len, ang, d) => {
      if (d > 7 || len < 2) return; const L = len * Math.min(1, Math.max(0, grow * 8 - d)); if (L <= 0) return;
      const sway = Math.sin(t * 1.2 + d) * 0.04 * d; const x2 = x + Math.cos(ang + sway) * L, y2 = y + Math.sin(ang + sway) * L;
      g.strokeStyle = d < 3 ? '#4a3420' : '#3f6b35'; g.lineWidth = Math.max(1, 8 - d); g.beginPath(); g.moveTo(x, y); g.lineTo(x2, y2); g.stroke();
      if (d >= 4) { g.fillStyle = d % 2 ? '#6fa04a' : '#8fbf5a'; g.beginPath(); g.ellipse(x2, y2, 8, 4, ang, 0, 7); g.fill(); }
      branch(x2, y2, len * 0.74, ang - 0.42, d + 1); branch(x2, y2, len * 0.7, ang + 0.38, d + 1);
    };
    branch(w * 0.5, h * 0.84, h * 0.17, -Math.PI / 2, 0);
  },
  // a floating molecular network
  network(g, w, h, t) {
    g.fillStyle = '#071417'; g.fillRect(0, 0, w, h);
    const N = 34, pts = [];
    for (let i = 0; i < N; i++) { const a = i * 2.399, r = Math.sqrt(i / N) * Math.min(w, h) * 0.45; pts.push([w / 2 + Math.cos(a + t * 0.1) * r + Math.sin(t * 0.5 + i) * 6, h / 2 + Math.sin(a + t * 0.1) * r * 1.3 + Math.cos(t * 0.4 + i) * 6]); }
    for (let i = 0; i < N; i++) for (let j = i + 1; j < N; j++) { const d = Math.hypot(pts[i][0] - pts[j][0], pts[i][1] - pts[j][1]); if (d < w * 0.2) { g.strokeStyle = `rgba(120,230,210,${0.35 * (1 - d / (w * 0.2))})`; g.lineWidth = 1.2; g.beginPath(); g.moveTo(...pts[i]); g.lineTo(...pts[j]); g.stroke(); } }
    pts.forEach(([x, y], i) => { g.fillStyle = i % 5 ? '#7fe6d0' : '#ffd27a'; g.shadowColor = g.fillStyle; g.shadowBlur = 12; g.beginPath(); g.arc(x, y, i % 5 ? 3 : 5, 0, 7); g.fill(); }); g.shadowBlur = 0;
  },
};
const panels = [];
document.querySelectorAll('canvas[data-paint]').forEach(c => {
  const o = { c, g: c.getContext('2d'), fn: painters[c.dataset.paint], visible: false };
  const size = () => { const d = Math.min(devicePixelRatio || 1, 2); o.w = c.clientWidth; o.h = c.clientHeight; c.width = o.w * d; c.height = o.h * d; o.g.setTransform(d, 0, 0, d, 0, 0); if (REDUCE) o.fn(o.g, o.w, o.h, 8); };
  new ResizeObserver(size).observe(c); new IntersectionObserver(es => es.forEach(e => (o.visible = e.isIntersecting)), { rootMargin: '100px' }).observe(c);
  panels.push(o);
});

/* ------------------------------------------------------------------ boot */
function make(Cls, sel, key, ...a) { const c = document.querySelector(sel); if (!c) return; try { new Cls(c, key, ...a); } catch (e) { console.warn('scene failed', key, e); c.classList.add('nogl'); } }
make(Earth, '#gl-hero', 'hero', 'hero');
make(Gold, '#gl-pour', 'pour');
make(Coin, '#gl-coin', 'swap');
make(Dusk, '#gl-still', 'still');
make(Energy, '#gl-glass', 'glass');
make(Earth, '#gl-join', 'join', 'join');
window.dispatchEvent(new Event('yanf-scenes'));

if (!REDUCE) {
  const t0 = performance.now();
  const loop = () => {
    if (!document.hidden) {
      stages.forEach(s => { if (s.visible && s.w) s.frame(); });
      const t = (performance.now() - t0) / 1000; panels.forEach(o => { if (o.visible && o.w) o.fn(o.g, o.w, o.h, t); });
    }
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}
