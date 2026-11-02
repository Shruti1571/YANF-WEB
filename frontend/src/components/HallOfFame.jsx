import React, { useEffect, useRef } from 'react';
import { HALL_OF_FAME } from '../data/hallOfFame';

/*
  The Hall of Fame — a walnut-panelled room. Framed honours hang on a turning arc;
  a single brass ceiling lamp lights whichever frame faces front. A paper plaque
  below names it. Adapted from "The Lantern Room" gallery.
*/

const FRAMES = ['gilt', 'walnut', 'ebony', 'oak', 'silver', 'bronze', 'float'];
const PALETTES = [
  ['#6b4a2b', '#c89a52', '#f1e2bf'],
  ['#3f2a1e', '#9c6b3f', '#e9d5b0'],
  ['#1f2a3a', '#7a8aa0', '#e6e0d2'],
  ['#5a3a1f', '#d1a85c', '#f5e8c8'],
  ['#2f3b33', '#8fa58a', '#ece6d6'],
  ['#4a2a22', '#b36b4a', '#f0dcc6'],
];
const TAU = Math.PI * 2;

function rng(seed) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// A placeholder "portrait to be hung": laurel wreath, a silhouette, a little grain.
function paintPlaceholder(i, w, h) {
  const cv = document.createElement('canvas');
  cv.width = w; cv.height = h;
  const c = cv.getContext('2d');
  const r = rng(11 + i * 7);
  const [dark, mid, light] = PALETTES[i % PALETTES.length];
  const bg = c.createRadialGradient(w * 0.5, h * 0.42, 0, w * 0.5, h * 0.45, h * 0.8);
  bg.addColorStop(0, light); bg.addColorStop(0.55, mid); bg.addColorStop(1, dark);
  c.fillStyle = bg; c.fillRect(0, 0, w, h);

  // laurel wreath
  const cx = w / 2, cy = h * 0.47, R = Math.min(w, h) * 0.34;
  c.fillStyle = 'rgba(40, 26, 12, 0.55)';
  for (const side of [-1, 1]) {
    for (let k = 0; k < 11; k++) {
      const a = Math.PI / 2 + side * (0.35 + k * 0.21);
      const x = cx + Math.cos(a) * R, y = cy + Math.sin(a) * R;
      c.save(); c.translate(x, y); c.rotate(a + side * 0.9);
      c.beginPath(); c.ellipse(0, 0, R * 0.05, R * 0.13, 0, 0, TAU); c.fill();
      c.restore();
    }
  }
  // silhouette
  c.fillStyle = 'rgba(30, 20, 10, 0.55)';
  c.beginPath(); c.arc(cx, cy - R * 0.22, R * 0.24, 0, TAU); c.fill();
  c.beginPath();
  c.moveTo(cx - R * 0.5, cy + R * 0.62);
  c.quadraticCurveTo(cx - R * 0.48, cy + R * 0.08, cx, cy + R * 0.08);
  c.quadraticCurveTo(cx + R * 0.48, cy + R * 0.08, cx + R * 0.5, cy + R * 0.62);
  c.closePath(); c.fill();
  // caption
  c.fillStyle = 'rgba(30, 20, 10, 0.7)';
  c.font = `${Math.round(h * 0.032)}px "Special Elite", "Courier New", monospace`;
  c.textAlign = 'center';
  c.fillText('PORTRAIT TO BE HUNG', cx, h * 0.92);
  // grain
  const count = (w * h / 70) | 0;
  for (let k = 0; k < count; k++) {
    c.fillStyle = r() < 0.5 ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)';
    const s = 1 + r() * 1.4; c.fillRect(r() * w, r() * h, s, s);
  }
  return cv.toDataURL('image/jpeg', 0.88);
}

export default function HallOfFame({ onClose, onNavigate }) {
  const rootRef = useRef(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;
    const $ = (s) => root.querySelector(s);
    const stage = $('.hof-stage'), ring = $('.hof-ring'), canvas = $('.hof-motes'), mctx = canvas.getContext('2d');
    const plaque = $('.hof-plaque'), pCat = $('.hof-p-cat'), pTitle = $('.hof-p-title'), pMeta = $('.hof-p-meta'), pFrame = $('.hof-p-frame');
    const playBtn = $('.hof-play'), prog = $('.hof-prog-bar');
    const reduceMQ = window.matchMedia('(prefers-reduced-motion: reduce)');

    const items = HALL_OF_FAME.map((e, i) => ({
      ...e,
      frame: FRAMES.includes(e.frame) ? e.frame : FRAMES[i % FRAMES.length],
      src: e.photo || paintPlaceholder(i, 900, 1125),
      w: e.photo ? 900 : 900,
      h: e.photo ? 1125 : 1125,
    }));
    const n = items.length;

    let pos = 0, from = 0, to = 0, t0 = 0, dur = 1, moving = false;
    let L = 0, settledAt = performance.now() + 500, dwellFrom = settledAt, lastNow = performance.now();
    let firstIgnite = true, playing = !reduceMQ.matches, swiped = false;
    let W = 0, H = 0, SP = 0, DZ = 0, P = 1400, CY = 0, dpr = 1;
    let beamTop = 42, beamH = 0, baseHalf = 0, raf = 0, alive = true;
    const EDGE = n === 1 ? 1 : Math.min(2.6, n / 2);
    const FADE = Math.min(0.7, EDGE * 0.5);
    const APEX_HALF = 11, DWELL = 4200;
    const FLICKER_FIRST = [[0, 0], [80, 0.5], [130, 0.05], [210, 0.7], [260, 0.2], [380, 0.9], [450, 0.72], [600, 1]];
    const FLICKER = [[0, 0], [90, 0.65], [150, 0.35], [320, 1]];
    const pad = (v) => String(v).padStart(2, '0');
    const idx = () => ((Math.round(to) % n) + n) % n;
    const ease = (p) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);
    const curve = (keys, t) => {
      for (let k = 1; k < keys.length; k++) {
        if (t < keys[k][0]) { const [ta, va] = keys[k - 1], [tb, vb] = keys[k]; return va + ((vb - va) * (t - ta)) / (tb - ta); }
      }
      return 1;
    };

    // build frames
    ring.textContent = '';
    items.forEach((it, i) => {
      const fig = document.createElement('figure');
      fig.className = 'hof-work f-' + it.frame;
      const moulding = document.createElement('div'); moulding.className = 'hof-moulding';
      const mat = document.createElement('div'); mat.className = 'hof-mat';
      const img = document.createElement('img'); img.className = 'hof-art'; img.src = it.src; img.draggable = false;
      img.alt = it.honoree ? `${it.honoree.name}, ${it.title}` : `${it.title}: portrait to be hung`;
      const sheen = document.createElement('span'); sheen.className = 'hof-sheen';
      const shade = document.createElement('span'); shade.className = 'hof-shade';
      mat.append(img); moulding.append(mat); fig.append(moulding, sheen, shade);
      fig.addEventListener('click', () => { if (swiped) { swiped = false; return; } goTo(i); });
      ring.append(fig); it.el = fig;
    });

    function aimBeam(i) {
      const el = items[i] && items[i].el; if (!el || !H) return;
      const fw = el.offsetWidth, fh = el.offsetHeight;
      const frameBottom = CY + fh / 2, poolY = H * 0.9;
      const slope = ((fw / 2) * 1.1 - APEX_HALF) / Math.max(40, frameBottom - beamTop);
      baseHalf = APEX_HALF + slope * (poolY - beamTop);
      beamH = poolY - beamTop;
      const s = stage.style;
      s.setProperty('--beam-top', beamTop + 'px');
      s.setProperty('--beam-w', (baseHalf * 2).toFixed(1) + 'px');
      s.setProperty('--beam-h', beamH.toFixed(1) + 'px');
      s.setProperty('--apex', (50 - (APEX_HALF / baseHalf) * 50).toFixed(2) + '%');
      s.setProperty('--pool-w', (baseHalf * 2.3).toFixed(1) + 'px');
      s.setProperty('--frame-w', fw + 'px');
      s.setProperty('--frame-h', fh + 'px');
    }

    function render() {
      for (let i = 0; i < n; i++) {
        const it = items[i];
        let d = (((i - pos) % n) + n) % n; if (d > n / 2) d -= n;
        const m = Math.abs(d), s = Math.sign(d);
        const x = s * SP * m * (1 - 0.12 * Math.min(m, 3));
        const z = -DZ * Math.pow(m, 1.3);
        const ry = s * (Math.min(m, 1) * 36 + Math.max(0, m - 1) * 12);
        const vis = Math.max(0, Math.min(1, (EDGE - m) / FADE));
        const lit = L * Math.max(0, 1 - m * 2.2);
        const shade = (0.55 + 0.3 * Math.min(1, m / 2)) * (1 - lit);
        const st = it.el.style;
        st.transform = `translate(-50%,-50%) perspective(${P.toFixed(0)}px) translate3d(${x.toFixed(1)}px,0,${z.toFixed(1)}px) rotateY(${ry.toFixed(2)}deg)`;
        st.opacity = vis.toFixed(3);
        st.visibility = vis < 0.01 ? 'hidden' : 'visible';
        st.zIndex = String(1000 - Math.round(m * 10));
        st.setProperty('--shade', shade.toFixed(3));
        st.setProperty('--lit', lit.toFixed(3));
        it.el.classList.toggle('is-front', m < 0.5);
      }
    }

    function layout() {
      const rect = stage.getBoundingClientRect();
      W = rect.width; H = rect.height;
      if (!W || !H) return;
      const narrow = W < 640;
      const maxH = Math.max(90, Math.min(H * 0.5, 440));
      const maxW = narrow ? W * 0.56 : Math.min(W * 0.4, 520);
      ring.style.fontSize = (maxH / 26).toFixed(2) + 'px';
      items.forEach((it) => {
        const ar = it.w / it.h; let ih = maxH, iw = ih * ar;
        if (iw > maxW) { iw = maxW; ih = iw / ar; }
        it.el.style.setProperty('--iw', iw.toFixed(1) + 'px');
        it.el.style.setProperty('--ih', ih.toFixed(1) + 'px');
      });
      SP = narrow ? W * 0.44 : Math.min(W * 0.41, 600);
      DZ = SP * 0.55;
      P = Math.max(900, W * 1.1);
      CY = H * 0.43;
      stage.style.setProperty('--cy', CY.toFixed(1) + 'px');
      dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      mctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      aimBeam(idx());
      render();
    }

    // dust in the beam
    const motes = Array.from({ length: 70 }, () => ({
      u: Math.random() * 2 - 1, v: Math.random(),
      du: (Math.random() - 0.5) * 0.00004, dv: (Math.random() - 0.35) * 0.00003,
      r: 0.5 + Math.random() * 1.5, a: 0.25 + Math.random() * 0.6, ph: Math.random() * TAU,
    }));
    function drawMotes(now, dt) {
      mctx.clearRect(0, 0, W, H);
      if (L < 0.02) return;
      const still = reduceMQ.matches;
      mctx.fillStyle = 'rgb(255,213,158)';
      for (const p of motes) {
        if (!still) {
          p.u += p.du * dt + Math.sin(now * 0.0006 + p.ph) * 0.00002 * dt;
          p.v += p.dv * dt;
          if (p.v > 1) p.v -= 1; else if (p.v < 0) p.v += 1;
          if (p.u > 1) p.u = -1; else if (p.u < -1) p.u = 1;
        }
        const y = beamTop + p.v * beamH;
        const hw = APEX_HALF + (baseHalf - APEX_HALF) * p.v;
        const x = W / 2 + p.u * hw * 0.85;
        const twinkle = still ? 1 : 0.6 + 0.4 * Math.sin(now * 0.002 + p.ph);
        mctx.globalAlpha = p.a * (1 - p.u * p.u) * L * twinkle * (1 - p.v * 0.55);
        mctx.beginPath(); mctx.arc(x, y, p.r, 0, TAU); mctx.fill();
      }
      mctx.globalAlpha = 1;
    }

    function setPlaque(i) {
      const it = items[i];
      pCat.textContent = `Spotlight ${pad(i + 1)} / ${pad(n)} · ${it.program}`;
      pTitle.textContent = it.title;
      if (it.honoree) {
        pMeta.textContent = [it.honoree.name, it.honoree.detail].filter(Boolean).join(' · ');
        pFrame.textContent = it.description;
      } else {
        pMeta.textContent = it.description;
        pFrame.textContent = 'Honoree: to be announced';
      }
    }
    function go(delta) {
      if (n < 2 || !delta) return;
      from = pos; to = Math.round(to) + delta; t0 = performance.now();
      dur = reduceMQ.matches ? 380 : Math.min(950 + 380 * (Math.abs(delta) - 1), 2200);
      moving = true; settledAt = Infinity;
      plaque.classList.add('is-dim');
      aimBeam(idx());
    }
    function goTo(i) {
      if (n < 2) return;
      let d = (((i - Math.round(to)) % n) + n) % n; if (d > n / 2) d -= n;
      go(d);
    }
    function settle() { setPlaque(idx()); plaque.classList.remove('is-dim'); }

    function tick(now) {
      if (!alive) return;
      const dt = Math.min(64, now - lastNow); lastNow = now;
      if (moving) {
        const p = Math.min(1, (now - t0) / dur);
        pos = from + (to - from) * ease(p);
        if (p >= 1) { moving = false; pos = to; settledAt = dwellFrom = now + 140; settle(); }
      }
      if (moving || now < settledAt) L = Math.max(0, L - dt / 160);
      else {
        const t = now - settledAt;
        L = reduceMQ.matches ? Math.min(1, t / 300) : curve(firstIgnite ? FLICKER_FIRST : FLICKER, t);
        if (firstIgnite && t > 700) firstIgnite = false;
      }
      stage.style.setProperty('--light', L.toFixed(3));
      render();
      drawMotes(now, dt);
      let p = 0;
      if (playing && !moving && now >= settledAt && n > 1) {
        p = Math.min(1, (now - dwellFrom) / DWELL);
        if (p >= 1) { go(1); p = 0; }
      }
      prog.style.strokeDashoffset = (100 - p * 100).toFixed(2);
      raf = requestAnimationFrame(tick);
    }

    function setPlaying(v) {
      playing = v;
      playBtn.dataset.state = v ? 'playing' : 'paused';
      playBtn.setAttribute('aria-label', v ? 'Pause rotation' : 'Resume rotation');
      if (v) dwellFrom = Math.max(performance.now(), settledAt);
    }

    const onPrev = () => go(-1);
    const onNext = () => go(1);
    const onPlay = () => setPlaying(!playing);
    const onKey = (e) => {
      if (e.target.closest && e.target.closest('input, textarea')) return;
      if (e.key === 'ArrowRight') { go(1); e.preventDefault(); }
      else if (e.key === 'ArrowLeft') { go(-1); e.preventDefault(); }
      else if (e.key === ' ' && !(e.target.closest && e.target.closest('button, a'))) { setPlaying(!playing); e.preventDefault(); }
    };
    let sx = null, sy = 0;
    const onDown = (e) => { sx = e.clientX; sy = e.clientY; swiped = false; };
    const onUp = (e) => {
      if (sx === null) return;
      const dx = e.clientX - sx, dy = e.clientY - sy; sx = null;
      if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) { swiped = true; go(dx < 0 ? 1 : -1); }
    };
    const onCancel = () => { sx = null; };

    $('.hof-prev').addEventListener('click', onPrev);
    $('.hof-next').addEventListener('click', onNext);
    playBtn.addEventListener('click', onPlay);
    document.addEventListener('keydown', onKey);
    stage.addEventListener('pointerdown', onDown);
    stage.addEventListener('pointerup', onUp);
    stage.addEventListener('pointercancel', onCancel);

    setPlaque(0);
    setPlaying(playing);
    const dimTimer = setTimeout(() => plaque.classList.remove('is-dim'), 600);
    const ro = new ResizeObserver(() => layout());
    ro.observe(stage);
    layout();
    raf = requestAnimationFrame(tick);

    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      clearTimeout(dimTimer);
      ro.disconnect();
      document.removeEventListener('keydown', onKey);
      stage.removeEventListener('pointerdown', onDown);
      stage.removeEventListener('pointerup', onUp);
      stage.removeEventListener('pointercancel', onCancel);
    };
  }, []);

  return (
    <div className="hof" ref={rootRef}>
      <header className="hof-bar">
        <div className="hof-mark">
          <p className="hof-kicker">More · Hall of Fame</p>
          <h1 className="hof-name">YANF Delegate Hall of Fame</h1>
          <p className="hof-sub">
            A digital monument celebrating our most distinguished delegates, best parliamentarians, top pitchers, and alumni who have represented YANF at national and international forums across the world.
          </p>
        </div>
        <div className="hof-bar-actions">
          <span className="hof-badge">Under Construction • Launching Soon</span>
          <button type="button" className="hof-back" onClick={onClose}>✕ Close</button>
        </div>
      </header>

      <main className="hof-stage" aria-label="Rotating hall of fame">
        <div className="hof-floor" aria-hidden="true" />
        <div className="hof-haze" aria-hidden="true" />
        <div className="hof-pool" aria-hidden="true" />
        <div className="hof-ring" />
        <div className="hof-beam" aria-hidden="true"><div className="hof-beam-shape" /></div>
        <canvas className="hof-motes" aria-hidden="true" />
        <div className="hof-vignette" aria-hidden="true" />
        <div className="hof-track" aria-hidden="true" />
        <div className="hof-lamp" aria-hidden="true"><span className="hof-lamp-body" /><span className="hof-lamp-lens" /></div>
      </main>

      <footer className="hof-foot">
        <p className="hof-hint">← → turn the hall · Space pauses<br />Swipe on a phone</p>
        <article className="hof-plaque is-dim" aria-live="polite">
          <p className="hof-p-cat">Spotlight 01</p>
          <h2 className="hof-p-title">Best Delegate Honor Roll</h2>
          <p className="hof-p-meta" />
          <p className="hof-p-frame" />
          <a
            className="hof-p-link"
            href="#page-contact"
            onClick={(e) => { e.preventDefault(); onNavigate('page-contact'); }}
          >
            Want early access or announcements? Get in touch →
          </a>
        </article>
        <div className="hof-controls">
          <button type="button" className="hof-icon-btn hof-prev" aria-label="Previous honour">
            <svg className="hof-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M14.5 5.5 8 12l6.5 6.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
          <button type="button" className="hof-icon-btn hof-play" data-state="playing" aria-label="Pause rotation">
            <svg className="hof-prog" viewBox="0 0 44 44" aria-hidden="true"><circle className="hof-prog-bar" cx="22" cy="22" r="21" pathLength="100" /></svg>
            <svg className="hof-ico hof-ico-pause" viewBox="0 0 24 24" aria-hidden="true"><rect x="7" y="6" width="3.2" height="12" rx="1" fill="currentColor" /><rect x="13.8" y="6" width="3.2" height="12" rx="1" fill="currentColor" /></svg>
            <svg className="hof-ico hof-ico-play" viewBox="0 0 24 24" aria-hidden="true"><path d="M8.5 5.8v12.4L18.5 12z" fill="currentColor" /></svg>
          </button>
          <button type="button" className="hof-icon-btn hof-next" aria-label="Next honour">
            <svg className="hof-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M9.5 5.5 16 12l-6.5 6.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
        </div>
      </footer>
    </div>
  );
}
