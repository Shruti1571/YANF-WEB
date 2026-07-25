gsap.registerPlugin(ScrollTrigger);

/* Videos are named scene-01.mp4 ... scene-19.mp4 and must sit in the
   same folder as index.html. Set VIDEO_DIR (e.g. "assets/videos/") if
   you move them, or add entries to FILE_OVERRIDES if you rename them. */
const VIDEO_DIR = "";
const FILE_OVERRIDES = {};
function resolveSrc(name) { return FILE_OVERRIDES[name] || (VIDEO_DIR + name); }

/* Missing-file reporter: shows exactly which videos failed to load */
const missingFiles = new Set();
function reportMissing(filename) {
  if (missingFiles.has(filename)) return;
  missingFiles.add(filename);
  let panel = document.getElementById('missing-panel');
  if (!panel) {
    panel = document.createElement('div');
    panel.id = 'missing-panel';
    panel.innerHTML = '<b>Video files not found:</b><ul></ul>' +
      '<span>Rename the files, or edit VIDEO_DIR / FILE_OVERRIDES at the top of js/main.js. Then reload.</span>' +
      '<button type="button">Dismiss</button>';
    panel.querySelector('button').onclick = () => panel.remove();
    document.body.appendChild(panel);
  }
  const li = document.createElement('li');
  li.textContent = filename;
  panel.querySelector('ul').appendChild(li);
}
function watchVideo(v, filename) {
  v.addEventListener('error', () => reportMissing(filename), { once: true });
}

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (prefersReducedMotion) document.body.classList.add('no-motion');

/* =================================================================
   SCENES — one entry per video, in narrative order.
================================================================= */
const SCENES = [
  { src: "scene-01.mp4",
    act: "ACT I", actName: "The Frontier", hero: true,
    kicker: "Youth As Nations' Front",
    title: "The world is a negotiation. Learn to sit at the table.",
    text: "YANF trains students in diplomacy, debate and leadership — the confidence to ask, the discipline to understand, the courage to lead." },

  { src: "scene-02.mp4",
    act: "ACT II", actName: "Power at Sea",
    kicker: "Power at Sea",
    title: "Every fleet is a foreign policy.",
    text: "Naval presence shapes trade routes, alliances and deterrence. Understanding hard power is where geopolitical literacy begins." },

  { src: "scene-03.mp4",
    act: "ACT II", actName: "Power at Sea",
    title: "What moves unseen still moves the world.",
    text: "Deterrence works in silence. Learn how nations signal strength without ever firing a shot." },

  { src: "scene-04.mp4",
    act: "ACT II", actName: "Surfacing", short: true,
    kicker: "Surfacing",
    title: "From the depths, decisions rise to land.",
    text: "" },

  { src: "scene-05.mp4",
    act: "ACT III", actName: "The Diplomatic Arena",
    kicker: "The Diplomatic Arena",
    title: "195 nations. One room. Your voice.",
    text: "From the General Assembly to the Security Council — learn how UN bodies actually work, and how resolutions are written, lobbied and won." },

  { src: "scene-06.mp4",
    act: "ACT III", actName: "The Diplomatic Arena",
    title: "A map is an argument.",
    text: "Read conflict zones the way analysts do: through history, resources, borders — and the people caught between them." },

  { src: "scene-07.mp4",
    act: "ACT III", actName: "The Diplomatic Arena",
    title: "Peace is a profession.",
    text: "Peacekeeping is logistics, law and negotiation under pressure — the hardest diplomacy there is, practised far from any podium." },

  { src: "scene-08.mp4",
    act: "ACT IV", actName: "Lifelines of Nations",
    kicker: "Lifelines of Nations",
    title: "Power, before politics.",
    text: "Electricity grids are national nervous systems — and strategic assets. Energy security is the quiet engine behind most foreign policy." },

  { src: "scene-09.mp4",
    act: "ACT IV", actName: "Lifelines of Nations",
    title: "The most political atom.",
    text: "Nuclear energy sits at the crossroads of climate, security and sovereignty. A YANF delegate learns to argue every side of it." },

  { src: "scene-10.mp4",
    act: "ACT IV", actName: "Lifelines of Nations",
    title: "Water is leverage.",
    text: "Dams power cities and spark disputes. Transboundary rivers are tomorrow's negotiation tables — and someone will have to sit at them." },

  { src: "scene-11.mp4",
    act: "ACT IV", actName: "Lifelines of Nations", short: true,
    title: "The currency beneath the currency.",
    text: "Fuel markets move faster than armies — and have shaped more borders." },

  { src: "scene-12.mp4",
    act: "ACT IV", actName: "Lifelines of Nations", short: true,
    title: "Where fuel rises, influence follows.",
    text: "From OPEC to embargoes: petro-politics is a century of case studies in leverage." },

  { src: "scene-13.mp4",
    act: "ACT IV", actName: "Lifelines of Nations", short: true,
    title: "Supply chains are strategy in motion.",
    text: "From wellhead to pump, every link is a policy choice someone negotiated." },

  { src: "scene-14.mp4",
    act: "ACT V", actName: "Hidden Networks",
    kicker: "Hidden Networks",
    title: "The internet lives underwater.",
    text: "Nearly all intercontinental data crosses the ocean floor through cables thinner than a garden hose. Whoever guards them guards the modern world." },

  { src: "scene-15.mp4",
    act: "ACT V", actName: "Hidden Networks",
    title: "Cut one cable, silence a continent.",
    text: "Digital infrastructure is the new strait, the new canal, the new border. The next generation of diplomats will negotiate over bandwidth." },

  { src: "scene-16.mp4",
    act: "ACT VI", actName: "The Transformation",
    kicker: "The Transformation",
    title: "Nations are being rebuilt in code.",
    text: "Automation, AI and advanced manufacturing are redrawing power faster than any treaty. Modernisation is the new arms race — and the new olive branch." },

  { src: "scene-17.mp4",
    act: "ACT VI", actName: "The Transformation",
    title: "Technology is policy now.",
    text: "From AI ethics to biotech regulation, tomorrow's negotiators must speak the language of machines as fluently as the language of law." },

  { src: "scene-18.mp4",
    act: "ACT VII", actName: "Youth Take Charge",
    kicker: "Youth Take Charge",
    title: "The classroom is the first assembly.",
    text: "At YANF, students don't just study the world order — they rehearse improving it. Question by question, motion by motion." },

  { src: "scene-19.mp4",
    act: "ACT VII", actName: "Youth Take Charge", finale: true }
];

/* =================================================================
   BUILD: video stack + scroll sections from the config
================================================================= */
const stack = document.getElementById('stack');
const film  = document.getElementById('film');
const captionsWrap = document.getElementById('captions');
const layers = [];
const caps = [];

function makeVideo(srcName) {
  const v = document.createElement('video');
  v.muted = true; v.loop = true; v.playsInline = true;
  v.setAttribute('playsinline', ''); v.setAttribute('muted', '');
  v.preload = 'none';
  v.dataset.src = resolveSrc(srcName);
  watchVideo(v, resolveSrc(srcName));
  return v;
}

SCENES.forEach((sc, i) => {
  // video layer — a single video, or a split panel of two videos side by side
  let layerEl;
  if (sc.src2) {
    layerEl = document.createElement('div');
    layerEl.className = 'split';
    layerEl._vids = [makeVideo(sc.src), makeVideo(sc.src2)];
    layerEl._vids.forEach(v => layerEl.appendChild(v));
  } else {
    layerEl = makeVideo(sc.src);
    layerEl._vids = [layerEl];
  }
  stack.appendChild(layerEl);
  layers.push(layerEl);

  // invisible scroll spacer — drives the timeline
  const sec = document.createElement('section');
  sec.className = 'scene' + (sc.short ? ' short' : '') + (sc.finale ? ' finale' : '');
  if (i === 0) sec.id = 'top';
  film.appendChild(sec);

  // caption slide — pinned at left-centre of the viewport
  const slide = document.createElement('div');
  slide.className = 'cap-slide' + (sc.finale ? ' finale-slide' : '');
  if (sc.finale) {
    slide.innerHTML = `
      <div class="cap">
        <div class="quote-mark">A PEACE NOTE — FROM THE YOUTH</div>
        <blockquote>"Peace will not be inherited by the young. It will be <em>negotiated</em> by them — and we intend to be ready."</blockquote>
        <div class="quote-attr">— Youth As Nations' Front</div>
        <div class="cta-row">
          <a class="btn solid" href="#page-mun">Explore events</a>
          <a class="btn" href="#page-about">About YANF</a>
        </div>
      </div>`;
  } else {
    slide.innerHTML = `
      <div class="cap">
        ${sc.kicker ? `<div class="kicker">${sc.kicker}</div>` : ''}
        ${sc.hero ? `<h1>${sc.title}</h1>` : `<h2>${sc.title}</h2>`}
        ${sc.text ? `<p>${sc.text}</p>` : ''}
      </div>`;
  }
  captionsWrap.appendChild(slide);
  caps.push(slide.querySelector('.cap'));
});

/* =================================================================
   PLAYBACK ENGINE — lazy load, crossfade, Ken Burns
================================================================= */
function ensureLoaded(i) {
  if (i < 0 || i >= layers.length) return;
  layers[i]._vids.forEach(v => { if (!v.src) { v.src = v.dataset.src; v.load(); } });
}
function safePlay(v) { const p = v.play(); if (p) p.catch(() => {}); }
function playLayer(el) { el._vids.forEach(safePlay); }
function pauseLayer(el) { el._vids.forEach(v => v.pause()); }

let current = -1;
let kenBurns = null;

function activate(i) {
  if (i === current) return;
  current = i;

  // lazy-load current + neighbours so scrolling ahead is seamless
  ensureLoaded(i - 1); ensureLoaded(i); ensureLoaded(i + 1); ensureLoaded(i + 2);

  layers.forEach((v, j) => {
    if (j === i) {
      v.style.zIndex = 2;
      playLayer(v);
      gsap.to(v, { opacity: 1, duration: 1.4, ease: 'power2.inOut' });
      if (!prefersReducedMotion) {
        if (kenBurns) kenBurns.kill();
        kenBurns = gsap.fromTo(v, { scale: 1.0 }, { scale: 1.07, duration: 14, ease: 'none' });
      }
    } else {
      v.style.zIndex = 1;
      gsap.to(v, {
        opacity: 0, duration: 1.4, ease: 'power2.inOut',
        onComplete: () => { if (current !== j) pauseLayer(v); }
      });
    }
  });

  // captions: the active act's statement fades in and HOLDS at
  // left-centre; the previous one lifts away in sync with the video
  caps.forEach((c, j) => {
    if (j === i) {
      gsap.fromTo(c,
        { autoAlpha: 0, y: prefersReducedMotion ? 0 : 46 },
        { autoAlpha: 1, y: 0, duration: prefersReducedMotion ? 0.4 : 1.0,
          ease: 'power3.out', delay: 0.2, overwrite: 'auto' });
    } else {
      gsap.to(c, { autoAlpha: 0, y: prefersReducedMotion ? 0 : -36,
        duration: 0.5, ease: 'power2.in', overwrite: 'auto' });
    }
  });

  // chapter marker removed
}

/* =================================================================
   SCROLLTRIGGERS — scene switching, reveals, progress, hint
================================================================= */
const sections = gsap.utils.toArray('#film section.scene');

sections.forEach((sec, i) => {
  ScrollTrigger.create({
    trigger: sec, start: 'top 55%', end: 'bottom 55%',
    onToggle: (self) => { if (self.isActive) activate(i); }
  });

});

gsap.to('#progress', {
  width: '100%', ease: 'none',
  scrollTrigger: { trigger: '#film', start: 'top top', end: 'bottom bottom', scrub: 0.4 }
});

gsap.to('#scroll-hint', {
  opacity: 0, ease: 'none',
  scrollTrigger: { trigger: '#film', start: 'top top', end: '5% top', scrub: true }
});

/* =================================================================
   BOOT — load first scenes, dismiss loader
================================================================= */
ensureLoaded(0); ensureLoaded(1);
const first = layers[0];

function boot() {
  document.getElementById('loader').classList.add('done');
  activate(0);
}
if (first.readyState >= 3) boot();
else {
  first.addEventListener('canplay', boot, { once: true });
  setTimeout(boot, 3500); // never trap the user on the loader
}

/* =================================================================
   PAGES — hash-routed overlays for About / Events / More
================================================================= */
const pages = document.querySelectorAll('.page');
let openPageEl = null;

function openPage(id) {
  const page = document.getElementById(id);
  if (!page) return;
  closePage(false);

  // build the page's background on first open — a still image or a
  // looping video, chosen from the file extension in data-bg
  const bg = page.querySelector('.page-bg');
  if (bg && !bg.querySelector('video, img')) {
    const src = resolveSrc(page.dataset.bg);
    if (/\.(png|jpe?g|webp|gif|svg|avif)$/i.test(src)) {
      const img = document.createElement('img');
      img.src = src; img.alt = '';
      img.addEventListener('error', () => reportMissing(src), { once: true });
      bg.prepend(img);
    } else {
      const v = document.createElement('video');
      v.muted = true; v.loop = true; v.playsInline = true;
      v.setAttribute('playsinline', ''); v.setAttribute('muted', '');
      v.src = src;
      watchVideo(v, src);
      bg.prepend(v);
    }
  }
  const bgv = bg ? bg.querySelector('video') : null;
  if (bgv) safePlay(bgv);

  page.classList.add('open');
  page.scrollTop = 0;
  document.body.style.overflow = 'hidden';
  openPageEl = page;
  if (current >= 0) pauseLayer(layers[current]);
  closeMobileMenu();
}

function closePage(clearHash = true) {
  if (!openPageEl) return;
  const bgv = openPageEl.querySelector('.page-bg video');
  if (bgv) bgv.pause();
  openPageEl.classList.remove('open');
  openPageEl = null;
  document.body.style.overflow = '';
  if (current >= 0) playLayer(layers[current]);
  if (clearHash && location.hash.startsWith('#page-')) {
    history.pushState('', document.title, location.pathname + location.search);
  }
}

function route() {
  const h = location.hash;
  if (h.startsWith('#page-')) openPage(h.slice(1));
  else {
    closePage(false);
    document.body.style.overflow = ''; // safety: never leave the page scroll-locked
  }
}
window.addEventListener('hashchange', route);
route(); // handle a deep link on load

pages.forEach(p => p.querySelector('.back').addEventListener('click', () => closePage()));
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { closePage(); closeMobileMenu(); } });
document.querySelectorAll('[data-close-pages]').forEach(el =>
  el.addEventListener('click', () => closePage()));

/* =================================================================
   NAV — dropdown tap support + mobile menu
================================================================= */
document.querySelectorAll('.nav-item > button').forEach(btn => {
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    const item = btn.parentElement;
    document.querySelectorAll('.nav-item.open').forEach(n => { if (n !== item) n.classList.remove('open'); });
    item.classList.toggle('open');
  });
});
document.addEventListener('click', () =>
  document.querySelectorAll('.nav-item.open').forEach(n => n.classList.remove('open')));

const mobileMenu = document.getElementById('mobile-menu');
function closeMobileMenu() { mobileMenu.classList.remove('open'); }
document.getElementById('hamburger').addEventListener('click', () => mobileMenu.classList.add('open'));
mobileMenu.querySelector('.close-mm').addEventListener('click', closeMobileMenu);
mobileMenu.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMobileMenu));

/* =================================================================
   SNAP SCROLL — one wheel gesture = one scene.
   Each wheel notch (or trackpad flick) glides the page to the next /
   previous scene instead of nudging it a few pixels. A gesture guard
   swallows the inertial tail of trackpads so a single flick can't
   skip several scenes. Touch, keyboard, scrollbar and reduced-motion
   stay fully native. On any error the interceptor removes itself.
================================================================= */
(function initSnapScroll() {
  if (prefersReducedMotion) return;
  if (window.matchMedia('(hover: none)').matches) return; // touch: native momentum

  const GLIDE_TIME = 1.1;   // seconds per scene transition
  const GESTURE_GAP = 140;  // ms of wheel silence that ends a gesture

  const root = document.scrollingElement || document.documentElement;
  const secEls = gsap.utils.toArray('#film section.scene');
  if (!secEls.length) return;

  const maxScroll = () => Math.max(0, root.scrollHeight - window.innerHeight);
  const overlayOpen = () =>
    document.querySelector('.page.open') !== null ||
    document.getElementById('mobile-menu').classList.contains('open');

  // scroll position that lands in the middle of scene i's trigger range
  // (ScrollTrigger activates a scene while its section straddles the
  //  55%-viewport line — see the triggers above)
  function targetFor(i) {
    if (i === 0) return 0;
    const sec = secEls[i];
    const t = sec.offsetTop - window.innerHeight * 0.55 + sec.offsetHeight * 0.5;
    return Math.max(0, Math.min(t, maxScroll()));
  }

  // scene index at a given scroll position (same 55% line as the triggers)
  function indexAt(pos) {
    const line = pos + window.innerHeight * 0.55;
    for (let i = secEls.length - 1; i >= 0; i--) {
      if (line >= secEls[i].offsetTop) return i;
    }
    return 0;
  }

  let animating = false;
  let lastEvent = 0;

  function disable() {
    window.removeEventListener('wheel', onWheel);
    gsap.killTweensOf(root); // native scroll takes over completely
    animating = false;
  }

  function goTo(i) {
    i = Math.max(0, Math.min(secEls.length - 1, i));
    animating = true;
    gsap.to(root, {
      scrollTop: targetFor(i),
      duration: GLIDE_TIME, ease: 'power2.inOut',
      overwrite: true,
      onComplete: () => { animating = false; },
      onInterrupt: () => { animating = false; }
    });
  }

  function onWheel(e) {
    try {
      // ---- all guards BEFORE preventDefault: native scroll wins on any doubt ----
      if (e.ctrlKey) return;                    // pinch-zoom gesture
      if (e.defaultPrevented) return;
      if (overlayOpen()) return;                // event pages / menu scroll natively
      if (maxScroll() <= 0) return;             // nothing to scroll

      let dy = e.deltaY;
      if (e.deltaMode === 1) dy *= 16;                       // lines -> px
      else if (e.deltaMode === 2) dy *= window.innerHeight;  // pages -> px
      if (!isFinite(dy) || dy === 0) return;

      e.preventDefault();

      const now = performance.now();
      const gap = now - lastEvent;
      lastEvent = now;

      if (animating) return;      // mid-glide: swallow extra ticks
      if (gap < GESTURE_GAP) return; // same gesture / trackpad inertia: swallow

      goTo(indexAt(root.scrollTop) + (dy > 0 ? 1 : -1));
    } catch (err) {
      disable(); // never trade an exception for a frozen page
    }
  }

  window.addEventListener('wheel', onWheel, { passive: false });
})();

/* Keep ScrollTrigger measurements fresh */
window.addEventListener('resize', () => ScrollTrigger.refresh());
