import React, { useEffect, useRef, useState } from 'react';
import { REDUCE, CONTACT_EMAIL, go } from './utils';
import { mountPainter } from './scenes';
import { PROGRAM_CARDS } from '../../data/programPages';


/* A live 2D generative canvas */
export function Painter({ kind, className = 'as-full', label }) {
  const ref = useRef(null);
  useEffect(() => (ref.current ? mountPainter(ref.current, kind) : undefined), [kind]);
  return <canvas ref={ref} className={className} role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : true} />;
}

const PROGRAMS_MENU = [
  ['page-mun', '01', 'Model United Nations'],
  ['page-debates', '02', 'Parliamentary Debates'],
  ['page-youth-parliament', '03', 'Youth Parliament (युवा संसद)'],
  ['page-innovation', '04', 'Innovation Assembly'],
];
const EXPLORE_MENU = [
  ['page-about', 'About YANF'], ['page-gallery', 'Gallery'], ['page-hall-of-fame', 'Hall of Fame'],
  ['page-blogs', 'Blogs'], ['page-certificates', 'Certificates'], ['page-resources', 'Resources'], ['page-contact', 'Contact'],
];

/* Global navigation + full-screen menu */
export function AssemblyNav({ onNavigate, activePage }) {
  const [open, setOpen] = useState(false);
  const firstLink = useRef(null);
  const slot = useRef(null), sq = useRef(null);
  /* the blue squares sit outside the colour-flipping bar so they always stay YANF blue */
  useEffect(() => {
    const place = () => { const a = slot.current, b = sq.current; if (!a || !b) return; const r = a.getBoundingClientRect(); b.style.cssText = `left:${r.left}px;top:${r.top}px;width:${r.width}px;height:${r.height}px`; };
    place(); const ro = new ResizeObserver(place); ro.observe(document.documentElement); if (slot.current) ro.observe(slot.current);
    window.addEventListener('resize', place); if (document.fonts) document.fonts.ready.then(place);
    return () => { ro.disconnect(); window.removeEventListener('resize', place); };
  }, []);
  useEffect(() => {
    if (!open) return undefined;
    const k = (e) => { if (e.key === 'Escape') { e.stopPropagation(); setOpen(false); } };
    window.addEventListener('keydown', k, true);
    const t = setTimeout(() => firstLink.current && firstLink.current.focus(), 350);
    return () => { window.removeEventListener('keydown', k, true); clearTimeout(t); };
  }, [open]);
  useEffect(() => { document.documentElement.classList.toggle('as-menu-open', open); }, [open]);
  const nav = (path) => (e) => { e.preventDefault(); setOpen(false); onNavigate(path); };

  return (
    <>
      <header className="as-nav">
        <div className="as-nav-l">
          <button type="button" className="as-menu-btn" aria-expanded={open} aria-controls="as-menu" onClick={() => setOpen(true)}>
            <span className="as-burger" aria-hidden="true"><i /><i /></span>Menu
          </button>
          <nav className="as-nav-links" aria-label="Primary">
            <a href="#page-about" onClick={nav('page-about')} aria-current={activePage === 'page-about' ? 'page' : undefined}>About</a>
            <a href="#page-gallery" onClick={nav('page-gallery')} aria-current={activePage === 'page-gallery' ? 'page' : undefined}>Gallery</a>
            <a href="#page-hall-of-fame" onClick={nav('page-hall-of-fame')} aria-current={activePage === 'page-hall-of-fame' ? 'page' : undefined}>Hall of Fame</a>
          </nav>
        </div>
        <a className="as-mark" href="#top" onClick={nav('top')} aria-label="YANF, Youth As Nations' Front, home"><span className="as-logo-slot" ref={slot} /><span className="as-logo-text" /></a>
        <a className="as-reg" href="#page-contact" onClick={nav('page-contact')}>Register</a>
      </header>
      <span className="as-logo-sq" ref={sq} aria-hidden="true" />

      <div id="as-menu" className={`as-menu ${open ? 'open' : ''}`} role="dialog" aria-modal="true" aria-label="Site menu" aria-hidden={!open} inert={!open}>
        <div className="as-menu-top">
          <a className="as-menu-mark" href="#top" onClick={nav('top')}><img src="/brand/yanf-logo-reversed.png" alt="YANF, Youth As Nations' Front" /></a>
          <button type="button" className="as-menu-close" onClick={() => setOpen(false)}>Close <span aria-hidden="true">✕</span></button>
        </div>
        <div className="as-menu-grid">
          <div>
            <p className="as-eyebrow">Programs</p>
            <ul className="as-menu-programs">
              {PROGRAMS_MENU.map(([p, no, name], i) => (
                <li key={p} style={{ '--i': i }}>
                  <a ref={i === 0 ? firstLink : undefined} href={`#${p}`} onClick={nav(p)} aria-current={activePage === p ? 'page' : undefined}><small>{no}</small>{name}</a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="as-eyebrow">Explore</p>
            <ul className="as-menu-explore">
              <li style={{ '--i': 4 }}><a href="#top" onClick={nav('top')}>Home</a></li>
              {EXPLORE_MENU.map(([p, name], i) => (
                <li key={p} style={{ '--i': i + 5 }}><a href={`#${p}`} onClick={nav(p)} aria-current={activePage === p ? 'page' : undefined}>{name}</a></li>
              ))}
            </ul>
          </div>
        </div>
        <div className="as-menu-foot">
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
          <span>Youth As Nations' Front · Where potential meets purpose.</span>
        </div>
      </div>
    </>
  );
}

/* Footer with the giant wordmark */
export function AssemblyFooter({ onNavigate }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current; if (!el) return undefined;
    if (REDUCE) { el.classList.add('in'); return undefined; }
    const io = new IntersectionObserver(es => es.forEach(e => e.isIntersecting && el.classList.add('in')), { threshold: 0.2 });
    io.observe(el); return () => io.disconnect();
  }, []);
  const l = (p, t) => <li><a href={`#${p}`} onClick={go(onNavigate, p)}>{t}</a></li>;
  return (
    <footer className="as-footer">
      <div className="as-foot-top">
        <div className="as-foot-brand"><img className="as-foot-logo" src="/brand/yanf-logo-reversed.png" alt="YANF, Youth As Nations' Front" /><p className="as-say">Built in classrooms.<br />Tested in assemblies.</p></div>
        <div><h5>Programs</h5><ul>{l('page-mun', 'Model United Nations')}{l('page-debates', 'Parliamentary Debates')}{l('page-youth-parliament', 'Yuva Sansad')}{l('page-innovation', 'Innovation Assembly')}</ul></div>
        <div><h5>Explore</h5><ul>{l('page-about', 'About')}{l('page-gallery', 'Gallery')}{l('page-hall-of-fame', 'Hall of Fame')}{l('page-blogs', 'Blogs')}{l('page-certificates', 'Certificates')}{l('page-resources', 'Resources')}</ul></div>
        <div><h5>Contact</h5><ul><li><a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a></li><li><a href="mailto:hello@yanfglobal.com">hello@yanfglobal.com</a></li>{l('page-contact', 'Register interest')}</ul></div>
      </div>
      <div className="as-wordmark" ref={ref} aria-hidden="true"><span>Y</span><span>A</span><span>N</span><span>F</span></div>
      <div className="as-foot-bottom"><span>© 2026 Youth As Nations' Front</span><span>Where potential meets purpose.</span></div>
    </footer>
  );
}

/* Big "next" card that leads to another program */
export function NextProgram({ id, onNavigate }) {
  const c = PROGRAM_CARDS[id]; if (!c) return null;
  return (
    <a className="as-next rv" href={`#${id}`} onClick={go(onNavigate, id)}>
      <Painter kind={c.paint} />
      <span className="as-next-shade" />
      <span className="as-next-copy">
        <small>Next</small>
        <b>{c.word}</b>
        <span>{c.name} →</span>
      </span>
    </a>
  );
}
