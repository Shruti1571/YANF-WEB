import React, { useEffect, useRef } from 'react';
import { PROGRAM_PAGES } from '../../data/programPages';
import { Painter, AssemblyFooter, NextProgram } from './common';
import { useReveal, go, REDUCE } from './utils';

/* One cinematic template for MUN, Parliamentary Debates and Yuva Sansad */
export default function ProgramPage({ id, onNavigate }) {
  const d = PROGRAM_PAGES[id];
  const root = useRef(null);
  useReveal(root, [id]);

  // hero parallax, driven by the page's own scroll container
  useEffect(() => {
    const el = root.current; const scroller = el?.closest('.page'); if (!scroller || REDUCE) return undefined;
    let raf = 0;
    const on = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(() => { const y = scroller.scrollTop, h = window.innerHeight; el.style.setProperty('--hp', Math.min(1, y / h).toFixed(4)); }); };
    scroller.addEventListener('scroll', on, { passive: true }); on();
    return () => { scroller.removeEventListener('scroll', on); cancelAnimationFrame(raf); };
  }, [id]);

  if (!d) return null;
  const words = d.name.split(' (')[0].split(' ');
  const register = `page-contact?program=${id}`;
  let n = 0;

  return (
    <div className="as-prog" ref={root} style={{ '--pc': d.color, '--pd': d.deep }}>
      <section className="pg-hero">
        <Painter kind={d.paint} label={`${d.name}, live illustration`} />
        <div className="pg-hero-shade" />
        <div className="pg-hero-copy">
          <h1 aria-label={d.name}>
            {words.map((w, i) => <span key={i} className="pg-word" style={{ '--i': i }}><span>{w}</span></span>)}
            {d.name.includes('युवा संसद') && <span className="pg-word pg-hindi" style={{ '--i': words.length }}><span>युवा संसद</span></span>}
          </h1>
          <div className="pg-facts">
            {d.highlights.slice(0, 2).map(([k, v]) => <span key={k}><small>{k}</small>{v}</span>)}
          </div>
        </div>
        <div className="pg-bigword" aria-hidden="true">{d.word}</div>
        <span className="pg-cue as-eyebrow" aria-hidden="true">Scroll<i /></span>
      </section>

      <section className="pg-lede">
        {d.intro && <p className="pg-intro rv">{d.intro}</p>}
        {d.whatTitle && <p className="as-eyebrow pg-what rv">{d.whatTitle}</p>}
        <p className="pg-lede-big rv">{d.lede}</p>
        {d.body && <p className="pg-lede-body rv">{d.body}</p>}
        <div className="pg-lede-actions rv">
          <a className="as-btn" href={`#${register}`} onClick={go(onNavigate, register)}>Register interest</a>
          <span>{d.highlights[0][1]} · {d.highlights[1][1]}</span>
        </div>
      </section>

      {d.sections.map((s) => {
        n += 1; const num = String(n).padStart(2, '0');
        if (s.type === 'list') return (
          <section key={s.title} className="pg-sec">
            <header className="pg-sec-head rv"><span className="pg-num">{num}</span><h2>{s.title}</h2></header>
            <ol className="pg-list">{s.items.map((it, i) => <li key={it} className="rv" style={{ '--d': `${i * 70}ms` }}><span>{String(i + 1).padStart(2, '0')}</span>{it}</li>)}</ol>
          </section>
        );
        if (s.type === 'text') return (
          <section key={s.title} className="pg-sec pg-split">
            <header className="pg-sec-head rv"><span className="pg-num">{num}</span><h2>{s.title}</h2></header>
            <p className="pg-text rv">{s.text}</p>
          </section>
        );
        if (s.type === 'cards') return (
          <section key={s.title} className="pg-sec pg-dark">
            <header className="pg-sec-head rv"><span className="pg-num">{num}</span><h2>{s.title}</h2></header>
            <div className={`pg-cards ${s.wide ? 'wide' : ''}`}>
              {s.cards.map((c, i) => (
                <article key={c.h} className="pg-card rv" style={{ '--d': `${i * 80}ms` }}>
                  <span className="pg-card-no">{String(i + 1).padStart(2, '0')}</span>
                  <h3>{c.h}</h3><p>{c.p}</p>
                  {c.items && <ul>{c.items.map(x => <li key={x}>{x}</li>)}</ul>}
                </article>
              ))}
            </div>
          </section>
        );
        return (
          <section key={s.title} className="pg-sec pg-gains">
            <header className="pg-sec-head rv"><span className="pg-num">{num}</span><h2>{s.title}</h2></header>
            {s.intro && <p className="pg-text pg-gains-intro rv">{s.intro}</p>}
            <ul>{s.items.map((it, i) => <li key={it} className="rv" style={{ '--d': `${i * 70}ms` }}>{it}</li>)}</ul>
          </section>
        );
      })}

      <section className="pg-sec pg-spec">
        <header className="pg-sec-head rv"><span className="pg-num">{String(n + 1).padStart(2, '0')}</span><h2>Event highlights</h2></header>
        <dl className="rv">{d.highlights.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>
      </section>

      <section className="pg-cta">
        <div className="pg-cta-in rv">
          <p>{d.cta}</p>
          <a className="as-btn light" href={`#${register}`} onClick={go(onNavigate, register)}>Register interest</a>
        </div>
      </section>

      <section className="pg-sec pg-links">
        <header className="pg-sec-head rv"><span className="pg-num">↗</span><h2>{d.linksTitle}</h2></header>
        <p className="pg-text rv">{d.linksText}</p>
        <div className="pg-linkgrid">
          {d.links.map(([href, b, p], i) => (
            <a key={href} className="rv" style={{ '--d': `${i * 60}ms` }} href={href} target="_blank" rel="noopener noreferrer">
              <b>{b}</b><span>{p}</span><i>Visit website ↗</i>
            </a>
          ))}
        </div>
      </section>

      <section className="pg-next-wrap"><NextProgram id={d.next} onNavigate={onNavigate} /></section>
      <AssemblyFooter onNavigate={onNavigate} />
    </div>
  );
}
