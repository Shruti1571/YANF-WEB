import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { fetchGalleryPhotos } from '../services/api';
import { SAMPLE_GALLERY, SHOW_SAMPLE_PHOTOS } from '../data/sampleGallery';

/*
  The Gallery — a darkroom. Each event is a contact sheet of film strips lying on a
  walnut bench under a red safelight. A brass loupe magnifies whatever frame it is
  over; clicking a frame lifts the print into full view.
  Photos come from the admin panel's Gallery tab (GET /api/gallery).
*/

const SECTIONS = [
  { id: 'all', label: 'All' },
  { id: 'committee', label: 'Committee Photos', text: 'Hi-res photography of debate sessions, unmoderated caucuses, and voting procedures.' },
  { id: 'ceremonies', label: 'Closing Ceremonies', text: 'Award announcements, gavel drops, and delegation group portraits.' },
  { id: 'behind-the-scenes', label: 'Behind the Scenes', text: 'Mentorship sessions, briefing prep, and social night moments.' },
];
const sectionLabel = (id) => (SECTIONS.find((s) => s.id === id) || {}).label || '';
const LOUPE = 190;
const ZOOM = 2.6;

export default function Gallery({ onClose }) {
  const [photos, setPhotos] = useState([]);
  const [status, setStatus] = useState('loading'); // loading | ready | error
  const [usingSamples, setUsingSamples] = useState(false);
  const [view, setView] = useState('globe'); // globe | sheets
  const [section, setSection] = useState('all');
  const [openIndex, setOpenIndex] = useState(-1);
  const [loupe, setLoupe] = useState(null); // { x, y, url, bx, by, bw, bh }
  const finePointer = useRef(typeof window !== 'undefined' && window.matchMedia('(hover: hover) and (pointer: fine)').matches);
  const closeBtnRef = useRef(null);

  useEffect(() => {
    let alive = true;
    const applySamples = () => { setPhotos(SAMPLE_GALLERY); setUsingSamples(true); setStatus('ready'); };
    fetchGalleryPhotos()
      .then((data) => {
        if (!alive) return;
        const list = Array.isArray(data) ? data : [];
        if (list.length === 0 && SHOW_SAMPLE_PHOTOS) applySamples();
        else { setPhotos(list); setStatus('ready'); }
      })
      .catch(() => {
        if (!alive) return;
        if (SHOW_SAMPLE_PHOTOS) applySamples(); else setStatus('error');
      });
    return () => { alive = false; };
  }, []);

  const visible = useMemo(() => (section === 'all' ? photos : photos.filter((p) => p.section === section)), [photos, section]);

  const sheets = useMemo(() => {
    const map = new Map();
    visible.forEach((p, i) => {
      const key = `${p.eventName}||${p.year || ''}`;
      if (!map.has(key)) map.set(key, { eventName: p.eventName, year: p.year, frames: [] });
      map.get(key).frames.push({ ...p, flatIndex: i });
    });
    return [...map.values()];
  }, [visible]);

  const counts = useMemo(() => {
    const c = { all: photos.length };
    photos.forEach((p) => { c[p.section] = (c[p.section] || 0) + 1; });
    return c;
  }, [photos]);

  // lightbox keys
  const step = useCallback((d) => setOpenIndex((i) => (i < 0 ? i : (i + d + visible.length) % visible.length)), [visible.length]);
  useEffect(() => {
    if (openIndex < 0) return undefined;
    const onKey = (e) => {
      if (e.key === 'ArrowRight') { step(1); e.preventDefault(); }
      else if (e.key === 'ArrowLeft') { step(-1); e.preventDefault(); }
      else if (e.key === 'Escape') { setOpenIndex(-1); e.stopPropagation(); }
    };
    window.addEventListener('keydown', onKey, true);
    if (closeBtnRef.current) closeBtnRef.current.focus();
    return () => window.removeEventListener('keydown', onKey, true);
  }, [openIndex, step]);

  const moveLoupe = (e, url) => {
    if (!finePointer.current) return;
    const r = e.currentTarget.getBoundingClientRect();
    const rx = e.clientX - r.left, ry = e.clientY - r.top;
    setLoupe({
      x: e.clientX, y: e.clientY, url,
      bw: r.width * ZOOM, bh: r.height * ZOOM,
      bx: -(rx * ZOOM - LOUPE / 2), by: -(ry * ZOOM - LOUPE / 2),
    });
  };

  const current = openIndex >= 0 ? visible[openIndex] : null;

  return (
    <div className="gl">
      <header className="gl-hero">
        <button type="button" className="gl-close gl-close-float" onClick={onClose}>✕ Close</button>
        <p className="gl-pill"><span className="gl-safelight" aria-hidden="true" /> More · Media Gallery</p>
        <h1 className="gl-title">YANF Moments &amp; Event Gallery</h1>
        <p className="gl-sub">Browse photo archives, committee highlights, keynotes, and press briefings from past assemblies.</p>
        <nav className="gl-tabs" aria-label="Gallery sections">
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              type="button"
              className={`gl-tab ${section === s.id ? 'is-on' : ''}`}
              aria-pressed={section === s.id}
              onClick={() => setSection(s.id)}
            >
              {s.label}
              {status === 'ready' && <span className="gl-count">{counts[s.id] || 0}</span>}
            </button>
          ))}
        </nav>
        <div className="gl-views" role="group" aria-label="Gallery view">
          <button type="button" className={view === 'globe' ? 'is-on' : ''} aria-pressed={view === 'globe'} onClick={() => setView('globe')}>Globe</button>
          <button type="button" className={view === 'sheets' ? 'is-on' : ''} aria-pressed={view === 'sheets'} onClick={() => setView('sheets')}>Contact sheets</button>
        </div>
        {usingSamples && (
          <p className="gl-sample-note" role="note">Sample photos — real photos from our assemblies are on their way.</p>
        )}
      </header>

      {status === 'ready' && view === 'globe' && visible.length > 0 && (
        <PhotoGlobe photos={visible} onOpen={(i) => { setLoupe(null); setOpenIndex(i); }} />
      )}

      <main className={`gl-bench ${view === 'globe' ? 'is-globe' : ''}`}>
        {status === 'loading' && <p className="gl-note" role="status">Developing…</p>}

        {status === 'error' && (
          <div className="gl-note-card" role="alert">
            <h2>The archive is out of reach right now.</h2>
            <p>We couldn't load the photos. Please check your connection and try again in a moment.</p>
          </div>
        )}

        {status === 'ready' && photos.length === 0 && (
          <div className="gl-empty">
            <div className="gl-sheet">
              <div className="gl-sheet-head">
                <span>Contact sheet · Roll 01</span>
                <span>Still in the developer</span>
              </div>
              <div className="gl-strip">
                {Array.from({ length: 6 }).map((_, i) => (
                  <span key={i} className="gl-frame gl-frame-blank" aria-hidden="true"><span className="gl-frame-no">{i + 1}</span></span>
                ))}
              </div>
              <p className="gl-empty-text">The first prints from our assemblies are still developing. They'll be hung here soon.</p>
            </div>
            <div className="gl-trays">
              {SECTIONS.slice(1).map((s) => (
                <div key={s.id} className="gl-tray">
                  <span className="gl-tray-label">{s.label}</span>
                  <p>{s.text}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {status === 'ready' && photos.length > 0 && visible.length === 0 && (
          <p className="gl-note">Nothing in {sectionLabel(section)} yet.</p>
        )}

        {view === 'sheets' && sheets.map((sheet, si) => (
          <section key={`${sheet.eventName}-${sheet.year}`} className="gl-sheet" style={{ '--tilt': `${[-0.6, 0.5, -0.3, 0.7][si % 4]}deg` }} aria-label={`${sheet.eventName}${sheet.year ? `, ${sheet.year}` : ''}`}>
            <div className="gl-sheet-head">
              <span>Contact sheet · Roll {String(si + 1).padStart(2, '0')}</span>
              <h2 className="gl-sheet-title">{sheet.eventName}{sheet.year ? ` · ${sheet.year}` : ''}</h2>
              <span>{sheet.frames.length} frame{sheet.frames.length === 1 ? '' : 's'}</span>
            </div>
            <div className="gl-strip">
              {sheet.frames.map((f, fi) => (
                <button
                  key={f._id || f.flatIndex}
                  type="button"
                  className="gl-frame"
                  onClick={() => { setLoupe(null); setOpenIndex(f.flatIndex); }}
                  onMouseMove={(e) => moveLoupe(e, f.url)}
                  onMouseLeave={() => setLoupe(null)}
                  aria-label={`Open photo: ${f.caption || f.altText}`}
                >
                  <img src={f.url} alt={f.altText} loading="lazy" />
                  <span className="gl-frame-no" aria-hidden="true">{fi + 1}{fi % 2 ? 'A' : ''}</span>
                </button>
              ))}
            </div>
          </section>
        ))}
      </main>

      {loupe && (
        <div
          className="gl-loupe"
          aria-hidden="true"
          style={{
            left: loupe.x - LOUPE / 2, top: loupe.y - LOUPE / 2,
            backgroundImage: `url("${loupe.url}")`,
            backgroundSize: `${loupe.bw}px ${loupe.bh}px`,
            backgroundPosition: `${loupe.bx}px ${loupe.by}px`,
          }}
        />
      )}

      {current && (
        <div className="gl-lightbox" role="dialog" aria-modal="true" aria-label={current.caption || current.altText} onClick={() => setOpenIndex(-1)}>
          <figure className="gl-print" onClick={(e) => e.stopPropagation()}>
            <img src={current.url} alt={current.altText} />
            <figcaption>
              <span className="gl-print-meta">{sectionLabel(current.section)} · {current.eventName}{current.year ? ` · ${current.year}` : ''}</span>
              {current.caption && <span className="gl-print-cap">{current.caption}</span>}
            </figcaption>
          </figure>
          <div className="gl-lb-controls" onClick={(e) => e.stopPropagation()}>
            <button type="button" onClick={() => step(-1)} aria-label="Previous photo">←</button>
            <span>Frame {openIndex + 1} of {visible.length}</span>
            <button type="button" onClick={() => step(1)} aria-label="Next photo">→</button>
            <button type="button" ref={closeBtnRef} onClick={() => setOpenIndex(-1)} className="gl-lb-close">Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- the globe: photos on a slowly turning dome ---------- */
const ROWS = [
  { lat: -8, count: 14 },
  { lat: 14, count: 13 },
  { lat: 35, count: 10 },
  { lat: 54, count: 6 },
];

function PhotoGlobe({ photos, onOpen }) {
  const stageRef = useRef(null);
  const sphereRef = useRef(null);
  const cardsRef = useRef([]);
  const st = useRef({ rot: 0, tilt: -14, vel: 0.05, dragging: false, moved: 0, lastX: 0, lastY: 0, hover: false });
  const [R, setR] = useState(560);

  const slots = useMemo(() => {
    const out = []; let k = 0;
    ROWS.forEach((row, ri) => {
      for (let i = 0; i < row.count; i++) {
        const lon = (360 / row.count) * i + (ri % 2 ? 180 / row.count : 0);
        out.push({ lat: row.lat, lon, idx: k % photos.length, key: `${ri}-${i}` });
        k++;
      }
    });
    return out;
  }, [photos.length]);

  useEffect(() => {
    const fit = () => {
      const w = stageRef.current ? stageRef.current.clientWidth : 1200;
      setR(Math.max(230, Math.min(560, w * 0.42)));
    };
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, []);

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let raf = 0;
    const tick = () => {
      const s = st.current;
      if (!s.dragging) {
        if (!reduce && !s.hover) s.rot += s.vel;
        s.vel += ((reduce ? 0 : 0.05) - s.vel) * 0.02;
      }
      if (sphereRef.current) {
        sphereRef.current.style.transform = `translateZ(${-R * 0.55}px) rotateX(${s.tilt}deg) rotateY(${s.rot}deg)`;
      }
      // light the frames that face the viewer
      const tr = (s.tilt * Math.PI) / 180;
      slots.forEach((sl, i) => {
        const el = cardsRef.current[i]; if (!el) return;
        const lon = ((sl.lon + s.rot) * Math.PI) / 180, lat = (sl.lat * Math.PI) / 180;
        const z = Math.cos(lat) * Math.cos(lon);          // facing before tilt
        const y = Math.sin(lat);
        const facing = z * Math.cos(tr) + y * Math.sin(-tr);
        const f = Math.max(0, Math.min(1, (facing - 0.62) / 0.32));
        el.style.setProperty('--f', f.toFixed(3));
        el.style.pointerEvents = facing > 0.05 ? 'auto' : 'none';
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [R, slots]);

  const down = (e) => {
    const s = st.current; s.dragging = true; s.moved = 0; s.lastX = e.clientX; s.lastY = e.clientY;
  };
  const move = (e) => {
    const s = st.current; if (!s.dragging) return;
    const dx = e.clientX - s.lastX, dy = e.clientY - s.lastY;
    s.lastX = e.clientX; s.lastY = e.clientY; s.moved += Math.abs(dx) + Math.abs(dy);
    s.rot += dx * 0.25; s.vel = dx * 0.25;
    s.tilt = Math.max(-32, Math.min(6, s.tilt - dy * 0.12));
  };
  const up = () => { st.current.dragging = false; };
  const key = (e) => {
    if (e.key === 'ArrowLeft') { st.current.rot += 12; e.preventDefault(); }
    if (e.key === 'ArrowRight') { st.current.rot -= 12; e.preventDefault(); }
  };

  const cardW = Math.round(R * 0.34), cardH = Math.round(R * 0.26);

  return (
    <div
      className="gl-globe"
      ref={stageRef}
      style={{ height: `${Math.round(R * 1.45)}px` }}
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
      onPointerCancel={up}
      onMouseEnter={() => { st.current.hover = true; }}
      onMouseLeave={() => { st.current.hover = false; st.current.dragging = false; }}
      onKeyDown={key}
      tabIndex={0}
      role="region"
      aria-label="Photo globe. Drag or use the arrow keys to turn it; select a photo to open it."
    >
      <div className="gl-globe-glow" aria-hidden="true" />
      <div className="gl-globe-cam" style={{ top: `${Math.round(R * 0.95)}px` }}>
        <div className="gl-sphere" ref={sphereRef}>
          {[-8, 14, 35, 54].map((lat) => {
            const r = R * Math.cos((lat * Math.PI) / 180) + 4;
            return <span key={`ring${lat}`} className="gl-ring" aria-hidden="true" style={{ width: r * 2, height: r * 2, marginLeft: -r, marginTop: -r, transform: `translateY(${-R * Math.sin((lat * Math.PI) / 180) + cardH / 2 + 6}px) rotateX(90deg)` }} />;
          })}
          {[1.5, 2.1].map((m) => (
            <span key={`big${m}`} className="gl-ring gl-ring-wide" aria-hidden="true" style={{ width: R * m * 2, height: R * m * 2, marginLeft: -R * m, marginTop: -R * m, transform: `translateY(${R * 0.2}px) rotateX(90deg)` }} />
          ))}
          {slots.map((sl, i) => {
            const p = photos[sl.idx];
            return (
              <button
                key={sl.key}
                type="button"
                ref={(el) => { cardsRef.current[i] = el; }}
                className="gl-card"
                tabIndex={i < photos.length ? 0 : -1}
                aria-hidden={i < photos.length ? undefined : 'true'}
                aria-label={`Open photo: ${p.caption || p.altText}`}
                style={{ width: cardW, height: cardH, marginLeft: -cardW / 2, marginTop: -cardH / 2, transform: `rotateY(${sl.lon}deg) rotateX(${sl.lat}deg) translateZ(${R}px)` }}
                onClick={() => { if (st.current.moved < 6) onOpen(sl.idx); }}
              >
                <img src={p.url} alt="" loading="lazy" draggable="false" />
              </button>
            );
          })}
        </div>
      </div>
      <p className="gl-globe-hint" aria-hidden="true">Drag to turn · click a photo to open it</p>
    </div>
  );
}
