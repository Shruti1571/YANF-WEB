import React, { useEffect, useRef, useState } from 'react';
import { InvestmentRound, WHY, PHASES, SKILLS, HIGHLIGHTS, LINKS } from '../InnovationAssembly';
import { mountIgnition } from './iaScene';
import { AssemblyFooter, Painter } from './common';
import { REDUCE, go } from './utils';

/*
  Innovation Assembly, "Ignition". The flagship page of YANF.
  A scroll-driven particle film (idea → pitch → investment → company), a word-by-word
  manifesto, split-screen founder/investor seats, a bento of reasons, a horizontal
  three-phase pipeline, the playable investment round, holographic skill cards,
  a term sheet and a launch CTA. All copy is from the programme document.
*/

const CHAPTERS = [
  { k: 'IDEA', no: '01', big: 'An idea.', sub: 'Every student has an idea.' },
  { k: 'PITCH', no: '02', big: 'A pitch.', sub: "YANF's Innovation Assembly gives them the stage to prove it." },
  { k: 'DEAL', no: '03', big: 'An investment.', sub: 'Investors weigh risk and opportunity, ask the hard questions, and back what they believe in.' },
  { k: 'SCALE', no: '04', big: 'A company.', sub: 'Pitch real ideas, challenge each other’s thinking, make bold decisions, just like founders and investors do in the real world.' },
];
const WHAT = [
  "Every student has an idea. YANF's Innovation Assembly gives them the stage to prove it. This one-of-a-kind simulation brings the world of entrepreneurship and investment straight to your school, where students pitch real ideas, challenge each other's thinking, and make bold decisions, just like founders and investors do in the real world.",
  'What makes it truly special is the dual experience. One student pitches their vision as an Innovator, while another weighs risks and opportunities as an Investor, and then they switch. By the end of it, every participant has lived both sides of the table. The summit crowns its own Best Entrepreneur and Best Investor, making the experience as exciting as it is educational.',
];
const KEYWORDS = /^(idea|stage|prove|entrepreneurship|investment|pitch|bold|decisions|dual|Innovator|Investor|switch|both|sides|table|Best|Entrepreneur)[.,]?$/i;
const WHY_ART = ['seats', 'spark', 'lexicon', 'mic', 'radar'];
const TICKER = ['Pitch', 'Invest', 'Disrupt', 'ROI', 'Valuation', 'Market sizing', 'Term sheets', 'Best Pitch', 'Best Investor', 'Storytelling'];

function Glyph({ name }) {
  const c = { viewBox: '0 0 120 120', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true };
  if (name === 'seats') return <svg {...c}><circle cx="36" cy="44" r="12" /><circle cx="84" cy="44" r="12" /><path d="M14 92c4-18 14-26 22-26s18 8 22 26M62 92c4-18 14-26 22-26s18 8 22 26" /><path className="gx-swap" d="M48 24h24M66 18l6 6-6 6M72 104H48M54 98l-6 6 6 6" /></svg>;
  if (name === 'spark') return <svg {...c}><path d="M60 22a26 26 0 0 0-14 48v10h28V70a26 26 0 0 0-14-48z" /><path d="M50 90h20M53 98h14" /><path className="gx-ray" d="M60 6v8M24 22l6 6M96 22l-6 6M12 54h8M100 54h8" /></svg>;
  if (name === 'lexicon') return <svg {...c}><path d="M16 96h88" /><path className="gx-bar" d="M28 96V70M48 96V58M68 96V44M88 96V28" /><path className="gx-line" d="M22 64l22-12 20 6 30-30" /></svg>;
  if (name === 'mic') return <svg {...c}><rect x="46" y="18" width="28" height="48" rx="14" /><path d="M34 56a26 26 0 0 0 52 0M60 82v18M44 104h32" /><path className="gx-wave" d="M18 44c-6 10-6 22 0 32M102 44c6 10 6 22 0 32" /></svg>;
  return <svg {...c}><circle cx="60" cy="60" r="44" /><circle cx="60" cy="60" r="28" /><circle cx="60" cy="60" r="12" /><path className="gx-sweep" d="M60 60L96 34" /><circle className="gx-blip" cx="82" cy="44" r="4" fill="currentColor" /></svg>;
}

export default function IAPage({ onNavigate }) {
  const root = useRef(null);
  const heroP = useRef(0);
  const [chapter, setChapter] = useState(-1);
  const [swapped, setSwapped] = useState(false);
  const [autoSwap, setAutoSwap] = useState(true);
  const [flipped, setFlipped] = useState({});

  /* the particle film */
  useEffect(() => {
    const host = root.current.querySelector('[data-ignition]');
    return mountIgnition(host, () => heroP.current, REDUCE);
  }, []);

  /* scroll choreography (the page scrolls inside its own overlay container) */
  useEffect(() => {
    const el = root.current; const scroller = el.closest('.page') || window;
    const hero = el.querySelector('.iax-hero'), what = el.querySelector('.iax-what'), how = el.querySelector('.iax-how');
    const words = [...el.querySelectorAll('.iax-w')]; const track = el.querySelector('.iax-track');
    let raf = 0, lastCh = -2;
    const prog = (sec) => { const top = sec.offsetTop, H = sec.offsetHeight - window.innerHeight; return Math.min(1, Math.max(0, ((scroller.scrollTop ?? window.scrollY) - top) / Math.max(1, H))); };
    const update = () => {
      raf = 0;
      const hp = prog(hero); heroP.current = hp; hero.style.setProperty('--hp', hp.toFixed(4));
      const ch = hp < 0.06 ? -1 : Math.min(3, Math.floor((hp - 0.06) / 0.94 * 4.2));
      if (ch !== lastCh) { lastCh = ch; setChapter(ch); }
      const wp = prog(what); const lit = wp * 1.15 * words.length;
      words.forEach((w, i) => w.classList.toggle('on', REDUCE || i < lit));
      const tp = prog(how); how.style.setProperty('--tp', tp.toFixed(4));
      if (track) track.style.transform = `translate3d(${-tp * Math.max(0, track.scrollWidth - window.innerWidth)}px,0,0)`;
    };
    const on = () => { if (!raf) raf = requestAnimationFrame(update); };
    scroller.addEventListener('scroll', on, { passive: true }); window.addEventListener('resize', on); update();
    // reveal-on-enter
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { root: scroller === window ? null : scroller, threshold: 0.15 });
    el.querySelectorAll('.rv').forEach(n => (REDUCE ? n.classList.add('in') : io.observe(n)));
    return () => { scroller.removeEventListener('scroll', on); window.removeEventListener('resize', on); cancelAnimationFrame(raf); io.disconnect(); };
  }, []);

  /* the two seats swap on their own until someone presses the button */
  useEffect(() => {
    if (!autoSwap || REDUCE) return undefined;
    const t = setInterval(() => setSwapped(s => !s), 3800); return () => clearInterval(t);
  }, [autoSwap]);

  const glow = (e) => { const r = e.currentTarget.getBoundingClientRect(); e.currentTarget.style.setProperty('--mx', `${e.clientX - r.left}px`); e.currentTarget.style.setProperty('--my', `${e.clientY - r.top}px`); };
  const tilt = (e) => { const r = e.currentTarget.getBoundingClientRect(); const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5; e.currentTarget.style.setProperty('--rx', `${-y * 14}deg`); e.currentTarget.style.setProperty('--ry', `${x * 18}deg`); glow(e); };
  const untilt = (e) => { e.currentTarget.style.setProperty('--rx', '0deg'); e.currentTarget.style.setProperty('--ry', '0deg'); };
  const scrollToRound = (e) => { e.preventDefault(); root.current.querySelector('#iax-round').scrollIntoView({ behavior: 'smooth', block: 'start' }); };
  const register = 'page-contact?program=page-innovation';
  let wi = 0;

  return (
    <div className="iax" ref={root}>
      {/* ============ IGNITION — the particle film ============ */}
      <section className="iax-hero" data-chapter={chapter}>
        <div className="iax-stage">
          <div className="iax-canvas" data-ignition role="img" aria-label="Glowing particles forming a light bulb, then a rocket, rising bars and a globe as you scroll" />
          <div className="iax-vignette" />
          <div className="iax-scan" aria-hidden="true" />

          <div className="iax-title">
            <h1 aria-label="Innovation Assembly"><span className="l1">Innovation</span><span className="l2">Assembly<sup>®</sup></span></h1>
            <p className="iax-tag"><span>Pitch</span><b>·</b><span>Invest</span><b>·</b><span>Disrupt</span></p>
            <p className="iax-intro">Where students stop studying business, <em>and start doing it.</em></p>
            <div className="iax-actions">
              <a className="iax-btn gold" href={`#${register}`} onClick={go(onNavigate, register)}><span>Register interest</span><i className="k" aria-hidden="true">→</i></a>
              <a className="iax-btn ghost" href="#iax-round" onClick={scrollToRound}><span>Try the investment round</span><i className="k" aria-hidden="true">↓</i></a>
            </div>
          </div>

          <div className="iax-chapters" aria-live="polite">
            {CHAPTERS.map((c, i) => (
              <div key={c.k} className={`iax-ch ${chapter === i ? 'on' : ''}`} aria-hidden={chapter !== i}>
                <h2>{c.big}</h2>
                <p>{c.sub}</p>
              </div>
            ))}
          </div>

          <div className="iax-hud" aria-hidden="true">
            <div className="iax-rail"><span style={{ transform: 'scaleY(var(--hp, 0))' }} /></div>
          </div>
          <span className="iax-cue" aria-hidden="true">Scroll to launch<i /></span>
        </div>
      </section>

      <div className="iax-ticker" aria-hidden="true"><div>{[0, 1].map(k => <span key={k}>{TICKER.map(t => <em key={`${k}${t}`}>{t}<i>✦</i></em>)}</span>)}</div></div>

      {/* ============ WHAT IS — manifesto that lights up as you read ============ */}
      <section className="iax-what">
        <div className="iax-what-in">
          <p className="iax-label">What is Innovation Assembly?</p>
          {WHAT.map((para, pi) => (
            <p key={pi} className={`iax-manifesto ${pi ? 'small' : ''}`}>
              {para.split(' ').map((w) => { wi += 1; return <span key={wi} className={`iax-w ${KEYWORDS.test(w) ? 'k' : ''}`}>{w} </span>; })}
            </p>
          ))}
        </div>
      </section>

      {/* ============ BOTH SIDES OF THE TABLE ============ */}
      <section className={`iax-dual ${swapped ? 'swapped' : ''}`}>
        <div className="iax-dual-head rv">
          <p className="iax-label">The dual experience</p>
          <h2>Both sides <em>of the table.</em></h2>
        </div>
        <div className="iax-seats">
          <article className="iax-seat a rv" onPointerMove={glow}>
            <span className="iax-seat-no">Seat 1</span>
            <strong key={`a${swapped}`}>{swapped ? 'Investor' : 'Innovator'}</strong>
            <p>{swapped ? 'Weighs risks and opportunities, asks probing questions and allocates a virtual portfolio.' : 'Pitches their vision: the problem, the solution, the audience, the business model, the growth plan.'}</p>
            <span className="iax-award">Best {swapped ? 'Investor' : 'Entrepreneur'}</span>
          </article>
          <button type="button" className="iax-switch" onClick={() => { setAutoSwap(false); setSwapped(s => !s); }} aria-label="Switch sides">
            <span className="iax-coin"><b>⇄</b><b>⇄</b></span><small>Switch sides</small>
          </button>
          <article className="iax-seat b rv" onPointerMove={glow}>
            <span className="iax-seat-no">Seat 2</span>
            <strong key={`b${swapped}`}>{swapped ? 'Innovator' : 'Investor'}</strong>
            <p>{swapped ? 'Pitches their vision: the problem, the solution, the audience, the business model, the growth plan.' : 'Weighs risks and opportunities, asks probing questions and allocates a virtual portfolio.'}</p>
            <span className="iax-award">Best {swapped ? 'Entrepreneur' : 'Investor'}</span>
          </article>
        </div>
      </section>

      {/* ============ WHY — bento ============ */}
      <section className="iax-why">
        <div className="iax-sec-head rv"><p className="iax-label">Why Innovation Assembly?</p><h2>Five reasons <em>to take the stage.</em></h2></div>
        <div className="iax-bento">
          {WHY.map((w, i) => (
            <article key={w} className={`iax-tile t${i} rv`} style={{ '--d': `${i * 90}ms` }} onPointerMove={glow}>
              <span className="iax-tile-no">{String(i + 1).padStart(2, '0')}</span>
              <span className="iax-glyph"><Glyph name={WHY_ART[i]} /></span>
              <p>{w}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ============ HOW IT WORKS — horizontal pipeline ============ */}
      <section className="iax-how">
        <div className="iax-how-stage">
          <div className="iax-how-head"><p className="iax-label">How it works</p><h2>Three phases. <em>One summit.</em></h2></div>
          <div className="iax-track">
            {PHASES.map((ph, i) => (
              <article key={ph.no} className="iax-phase">
                <span className="iax-phase-big" aria-hidden="true">{i + 1}</span>
                <span className="iax-phase-no">{ph.no}</span>
                <h3>{ph.title}</h3>
                <p>{ph.text}</p>
              </article>
            ))}
            <article className="iax-phase iax-phase-end">
              <span className="iax-label">The result</span>
              <h3>Every participant walks away with an experience no textbook could provide.</h3>
            </article>
          </div>
          <div className="iax-pipe" aria-hidden="true"><span /><i style={{ left: 'calc(var(--tp,0) * 100%)' }} /></div>
        </div>
      </section>

      {/* ============ THE FLOOR — playable round ============ */}
      <section id="iax-round" className="iax-round">
        <div className="iax-sec-head rv"><p className="iax-label">The floor is open</p><h2>You're the investor. <em>Make the call.</em></h2></div>
        <div className="iax-round-frame rv"><InvestmentRound /></div>
      </section>

      {/* ============ SKILLS — holographic cards ============ */}
      <section className="iax-skills">
        <div className="iax-sec-head rv"><p className="iax-label">Business skills students learn</p><h2>The founder's <em>vocabulary.</em></h2></div>
        <div className="iax-holo-grid">
          {SKILLS.map((s, i) => (
            <button key={s.term} type="button" className={`iax-holo rv ${flipped[s.term] ? 'flipped' : ''}`} style={{ '--d': `${i * 70}ms` }}
              aria-pressed={!!flipped[s.term]} onPointerMove={tilt} onPointerLeave={untilt} onClick={() => setFlipped(f => ({ ...f, [s.term]: !f[s.term] }))}>
              <span className="iax-holo-in">
                <span className="iax-holo-front"><small>{String(i + 1).padStart(2, '0')}</small><b>{s.term}</b><em>Tap to reveal</em></span>
                <span className="iax-holo-back"><b>{s.term}</b><span>{s.text.charAt(0).toUpperCase() + s.text.slice(1)}.</span></span>
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* ============ TERM SHEET ============ */}
      <section className="iax-terms">
        <div className="iax-ticket rv">
          <div className="iax-ticket-head"><span className="iax-label">Term sheet</span><h2>Event highlights</h2><span className="iax-ticket-id">YANF · IA · 2026</span></div>
          <dl>{HIGHLIGHTS.map(([k, v], i) => <div key={k} style={{ '--d': `${i * 80}ms` }}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>
          <span className="iax-approved" aria-hidden="true">Approved</span>
        </div>
      </section>

      {/* ============ LAUNCH CTA ============ */}
      <section className="iax-launch">
        <Painter kind="sparks" />
        <div className="iax-launch-in rv">
          <p className="iax-label">T-minus zero</p>
          <h2>Got an idea? <em>Ready to invest?</em></h2>
          <p>Join Innovation Assembly at YANF.</p>
          <a className="iax-btn gold big" href={`#${register}`} onClick={go(onNavigate, register)}><span>Register interest</span><i className="k" aria-hidden="true">→</i></a>
        </div>
      </section>

      {/* ============ READING LIST ============ */}
      <section className="iax-links">
        <div className="iax-sec-head rv"><p className="iax-label">Explore the world of entrepreneurship</p><h2>Learn from <em>the real floor.</em></h2>
          <p className="iax-sub">Explore these globally recognised platforms to understand how real entrepreneurs and investors think, pitch, and build businesses.</p></div>
        <div className="iax-link-grid">
          {LINKS.map(([href, name, text], i) => (
            <a key={href} className="iax-link rv" style={{ '--d': `${i * 60}ms` }} href={href} target="_blank" rel="noopener noreferrer" onPointerMove={glow}>
              <b>{name}</b><span>{text}</span><i>Visit website ↗</i>
            </a>
          ))}
        </div>
      </section>

      <AssemblyFooter onNavigate={onNavigate} />
    </div>
  );
}
