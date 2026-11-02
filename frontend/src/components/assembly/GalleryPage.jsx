import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { fetchGalleryPhotos } from '../../services/api';
import { SAMPLE_GALLERY, SHOW_SAMPLE_PHOTOS } from '../../data/sampleGallery';
import { mountArchive } from './galleryScene';
import { AssemblyFooter } from './common';
import { REDUCE } from './utils';

/*
  Gallery — "The Archive". Photos hang on a glowing 3D helix the camera rides as you scroll;
  below it, a filterable masonry wall and a full-screen cinematic lightbox.
  Photos come from the admin Gallery tab (GET /api/gallery); sample photos fill in until then.
*/

const SECTIONS = [
  { id: 'all', label: 'Everything' },
  { id: 'committee', label: 'In committee' },
  { id: 'ceremonies', label: 'On stage' },
  { id: 'behind-the-scenes', label: 'Behind the scenes' },
];

export default function GalleryPage({ onNavigate }) {
  const root = useRef(null);
  const heroP = useRef(0);
  const [photos, setPhotos] = useState([]);
  const [samples, setSamples] = useState(false);
  const [section, setSection] = useState('all');
  const [event, setEvent] = useState('all');
  const [open, setOpen] = useState(-1); // index into `visible`
  const [openFrom, setOpenFrom] = useState(null); // 'wall' | 'helix'
  const touch = useRef(null);

  useEffect(() => {
    let alive = true;
    const applySamples = () => { setPhotos(SAMPLE_GALLERY); setSamples(true); };
    fetchGalleryPhotos()
      .then((d) => { if (!alive) return; const list = Array.isArray(d) ? d : []; if (!list.length && SHOW_SAMPLE_PHOTOS) applySamples(); else setPhotos(list); })
      .catch(() => { if (alive && SHOW_SAMPLE_PHOTOS) applySamples(); });
    return () => { alive = false; };
  }, []);

  const events = useMemo(() => ['all', ...new Set(photos.map(p => p.eventName).filter(Boolean))], [photos]);
  const visible = useMemo(() => photos.filter(p => (section === 'all' || p.section === section) && (event === 'all' || p.eventName === event)), [photos, section, event]);
  const list = openFrom === 'helix' ? photos : visible;
  const current = open >= 0 ? list[open] : null;

  /* 3D helix */
  useEffect(() => {
    if (!photos.length) return undefined;
    const host = root.current.querySelector('[data-archive]');
    return mountArchive(host, photos, { getProgress: () => heroP.current, onOpen: (i) => { setOpenFrom('helix'); setOpen(i); }, reduce: REDUCE });
  }, [photos]);

  /* scroll: hero progress + reveals */
  useEffect(() => {
    const el = root.current; const scroller = el.closest('.page') || window;
    const hero = el.querySelector('.glx-hero'); let raf = 0;
    const update = () => { raf = 0; const H = hero.offsetHeight - window.innerHeight; const p = Math.min(1, Math.max(0, ((scroller.scrollTop ?? window.scrollY) - hero.offsetTop) / Math.max(1, H))); heroP.current = p; hero.style.setProperty('--hp', p.toFixed(4)); };
    const on = () => { if (!raf) raf = requestAnimationFrame(update); };
    scroller.addEventListener('scroll', on, { passive: true }); update();
    return () => { scroller.removeEventListener('scroll', on); cancelAnimationFrame(raf); };
  }, []);
  useEffect(() => {
    const el = root.current; const scroller = el.closest('.page');
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { root: scroller, threshold: 0.08 });
    el.querySelectorAll('.glx-card:not(.in), .rv:not(.in)').forEach(n => (REDUCE ? n.classList.add('in') : io.observe(n)));
    return () => io.disconnect();
  }, [visible]);

  /* lightbox keys */
  const step = useCallback((d) => setOpen(i => (i < 0 ? i : (i + d + list.length) % list.length)), [list.length]);
  useEffect(() => {
    if (open < 0) return undefined;
    const k = (e) => { if (e.key === 'ArrowRight') { step(1); e.preventDefault(); } else if (e.key === 'ArrowLeft') { step(-1); e.preventDefault(); } else if (e.key === 'Escape') { setOpen(-1); e.preventDefault(); e.stopPropagation(); } };
    window.addEventListener('keydown', k, true); return () => window.removeEventListener('keydown', k, true);
  }, [open, step]);

  const tilt = (e) => { const r = e.currentTarget.getBoundingClientRect(); const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5; e.currentTarget.style.setProperty('--rx', `${-y * 8}deg`); e.currentTarget.style.setProperty('--ry', `${x * 10}deg`); e.currentTarget.style.setProperty('--mx', `${(x + 0.5) * 100}%`); e.currentTarget.style.setProperty('--my', `${(y + 0.5) * 100}%`); };
  const untilt = (e) => { e.currentTarget.style.setProperty('--rx', '0deg'); e.currentTarget.style.setProperty('--ry', '0deg'); };
  const toWall = (e) => { e.preventDefault(); root.current.querySelector('#glx-wall').scrollIntoView({ behavior: 'smooth' }); };
  const programs = events.length - 1;

  return (
    <div className="glx" ref={root}>
      {/* ============ THE ARCHIVE — 3D helix ============ */}
      <section className="glx-hero">
        <div className="glx-stage">
          <div className="glx-canvas" data-archive role="img" aria-label="Event photographs hanging on a glowing spiral; scroll to travel through it, drag to turn, click a photo to open it" />
          <div className="glx-vignette" />
          <div className="glx-title">
            <p className="glx-label">Gallery · The archive</p>
            <h1><span>Moments</span><em>from the floor.</em></h1>
            <p className="glx-meta"><b>{photos.length || '…'}</b> photographs <i>·</i> <b>{programs || '…'}</b> programs <i>·</i> one assembly</p>
            <a className="glx-btn" href="#glx-wall" onClick={toWall}><span>See every photo</span><i className="k" aria-hidden="true">↓</i></a>
          </div>
          <div className="glx-hint" aria-hidden="true"><span>Scroll to travel</span><span>Drag to turn</span><span>Click to open</span></div>
          <div className="glx-reel" aria-hidden="true"><span style={{ transform: 'scaleX(var(--hp,0))' }} /></div>
        </div>
      </section>

      {/* ============ THE WALL ============ */}
      <section className="glx-wall-sec" id="glx-wall">
        <header className="glx-wall-head rv">
          <div><p className="glx-label">The wall</p><h2>Every frame, <em>every room.</em></h2></div>
          {samples && <p className="glx-note">Sample photos. Real photographs from our assemblies are on their way.</p>}
        </header>
        <div className="glx-filters" role="toolbar" aria-label="Filter photos">
          <div className="glx-chips">
            {SECTIONS.map(s => (
              <button key={s.id} type="button" className={section === s.id ? 'on' : ''} aria-pressed={section === s.id} onClick={() => setSection(s.id)}>{s.label}</button>
            ))}
          </div>
          <label className="glx-select"><span>Program</span>
            <select value={event} onChange={e => setEvent(e.target.value)}>{events.map(ev => <option key={ev} value={ev}>{ev === 'all' ? 'All programs' : ev}</option>)}</select>
          </label>
        </div>
        <div className="glx-masonry">
          {visible.map((p, i) => (
            <button key={`${p._id}-${section}-${event}`} type="button" className={`glx-card v${i % 5}`} style={{ '--d': `${(i % 6) * 60}ms` }}
              onPointerMove={tilt} onPointerLeave={untilt} onClick={() => { setOpenFrom('wall'); setOpen(i); }} aria-label={`Open photo: ${p.caption || p.altText || ''}`}>
              <span className="glx-card-in">
                <img src={p.url} alt={p.altText || p.caption || ''} loading="lazy" />
                <span className="glx-sheen" />
                <span className="glx-cap"><small>{p.eventName}{p.year ? ` · ${p.year}` : ''}</small>{p.caption}</span>
                <span className="glx-num">{String(i + 1).padStart(2, '0')}</span>
              </span>
            </button>
          ))}
          {!visible.length && <p className="glx-empty">No photos here yet.</p>}
        </div>
      </section>

      {/* ============ CTA ============ */}
      <section className="glx-cta rv">
        <p className="glx-label">Your frame is next</p>
        <h2>The next photograph <em>could be you.</em></h2>
        <a className="glx-btn gold" href="#page-contact" onClick={(e) => { e.preventDefault(); onNavigate('page-contact'); }}><span>Register for the next session</span><i className="k" aria-hidden="true">→</i></a>
      </section>

      <AssemblyFooter onNavigate={onNavigate} />

      {/* ============ LIGHTBOX ============ */}
      {current && createPortal(
        <div className="glx-lb" role="dialog" aria-modal="true" aria-label="Photo viewer"
          onTouchStart={e => { touch.current = e.touches[0].clientX; }}
          onTouchEnd={e => { if (touch.current == null) return; const dx = e.changedTouches[0].clientX - touch.current; if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1); touch.current = null; }}>
          <div className="glx-lb-bg" style={{ backgroundImage: `url(${current.url})` }} />
          <div className="glx-lb-top">
            <span className="glx-lb-count">{String(open + 1).padStart(2, '0')} / {String(list.length).padStart(2, '0')}</span>
            <button type="button" className="glx-lb-close" onClick={() => setOpen(-1)} autoFocus>Close ✕</button>
          </div>
          <figure className="glx-lb-fig" key={current._id}>
            <img src={current.url} alt={current.altText || current.caption || ''} />
            <figcaption><small>{current.eventName}{current.year ? ` · ${current.year}` : ''}</small>{current.caption}</figcaption>
          </figure>
          <button type="button" className="glx-lb-nav prev" onClick={() => step(-1)} aria-label="Previous photo">←</button>
          <button type="button" className="glx-lb-nav next" onClick={() => step(1)} aria-label="Next photo">→</button>
          <div className="glx-lb-thumbs">
            {list.map((p, i) => (
              <button key={p._id} type="button" className={i === open ? 'on' : ''} onClick={() => setOpen(i)} aria-label={`Photo ${i + 1}`}><img src={p.url} alt="" loading="lazy" /></button>
            ))}
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}
