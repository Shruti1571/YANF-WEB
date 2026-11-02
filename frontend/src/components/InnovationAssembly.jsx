import React, { useEffect, useMemo, useRef, useState } from 'react';

/*
  Innovation Assembly, "The Pitch Floor".
  A studio stage with sweeping spotlights, a swap-the-seat Innovator/Investor duo,
  an animated three-phase timeline, a playable practice Investment Round
  (sample pitches, play money), flip-card business vocabulary and a term-sheet
  style highlights block. All programme copy is from the original event page.
*/

const START_FUND = 1000000; // play money for the practice round
const STEP = 50000;
const inr = (n) => `₹${Math.round(n).toLocaleString('en-IN')}`;

const WHY = [
  'Experience both sides of the business table, as a founder and as an investor',
  'Develop entrepreneurial thinking and creative problem-solving',
  'Learn real business vocabulary: pitches, ROI, valuation, market sizing, term sheets',
  'Build confidence to present, persuade, and defend ideas under scrutiny',
  'Understand how investors evaluate risk, opportunity, and potential',
];

const PHASES = [
  { no: 'Phase 1', title: 'The Innovation Pitch', icon: 'mic', text: "Students assigned as Innovators develop and present a business idea to a panel of student Investors. They prepare a pitch, covering the problem they're solving, their solution, target audience, business model, and growth plan. Innovators are evaluated on creativity, clarity, feasibility, and their ability to handle investor questions." },
  { no: 'Phase 2', title: 'The Investment Round', icon: 'coins', text: 'Students assigned as Investors evaluate pitches, ask probing questions, and decide where to allocate their virtual investment portfolio. They are evaluated on their ability to ask the right questions, assess risk, identify opportunity, and make strategic investment decisions.' },
  { no: 'Phase 3', title: 'The Summit Awards', icon: 'trophy', text: 'The summit concludes with the crowning of the Best Entrepreneur, whose idea won the most investment and admiration, and the Best Investor, whose portfolio choices and questioning showed the sharpest business acumen. Every participant walks away with an experience no textbook could provide.' },
];

const SKILLS = [
  { term: 'Pitching', text: 'how to present an idea clearly, confidently, and compellingly' },
  { term: 'Market research', text: 'understanding your audience, competition, and industry landscape' },
  { term: 'Valuation', text: 'how businesses are valued and what makes them investable' },
  { term: 'ROI & risk', text: 'return on investment, risk assessment, and financial thinking' },
  { term: 'Term sheets', text: 'the basics of deal-making and investment terms' },
  { term: 'Storytelling', text: 'how the best entrepreneurs make investors believe in their vision' },
];

const HIGHLIGHTS = [
  ['Duration', '1 – 2 Days'],
  ['Suitable for', 'Grade 9 onwards'],
  ['Roles', 'Innovator (Entrepreneur) & Investor'],
  ['Awards', 'Best Entrepreneur, Best Investor, Most Innovative Idea, Best Pitch'],
  ['Language', 'English'],
];

const LINKS = [
  ['https://www.ycombinator.com', 'Y Combinator', "World's top startup accelerator & pitch resources"],
  ['https://www.ted.com/topics/business', 'TED, Business', 'Best entrepreneurship & innovation talks'],
  ['https://www.investopedia.com', 'Investopedia', 'Learn business & investing terms'],
  ['https://www.sonyliv.com/shows/shark-tank-india', 'Shark Tank India', 'Watch real pitches & investor decisions'],
  ['https://www.startupindia.gov.in', 'Startup India', "Government of India's startup ecosystem portal"],
  ['https://www.forbes.com/entrepreneurs', 'Forbes Entrepreneurs', "Stories & insights from the world's top founders"],
];

// Practice-round pitches: invented examples, clearly labelled as samples on the page.
const PITCHES = [
  {
    id: 'bin', name: 'BinBuddy', by: 'Sample pitch · Team A',
    problem: 'School canteens throw away food every single day, and nobody measures how much.',
    solution: 'A smart compost bin plus a class-wise waste leaderboard that turns leftovers into garden compost.',
    ask: 300000, equity: 10,
    question: 'How will you make money?',
    answer: 'Schools pay a yearly subscription for the bins and the dashboard; compost is sold back to local nurseries.',
  },
  {
    id: 'van', name: 'RouteRakshak', by: 'Sample pitch · Team B',
    problem: 'Parents wait at the gate with no idea where the school van is.',
    solution: 'A live van tracker with arrival alerts, built for school transport operators.',
    ask: 400000, equity: 15,
    question: 'Who is your competition?',
    answer: 'General map apps, but none handle a whole school fleet with parent alerts and attendance on boarding.',
  },
  {
    id: 'peer', name: 'PeerPath', by: 'Sample pitch · Team C',
    problem: 'Students who are great at one subject rarely get to teach it.',
    solution: 'A peer-tutoring marketplace inside the school, where seniors earn credits by tutoring juniors.',
    ask: 250000, equity: 8,
    question: 'What is the biggest risk?',
    answer: 'Keeping tutors active after exams. The plan: credits redeemable for internships with partner companies.',
  },
];

function Icon({ name }) {
  const common = { width: 34, height: 34, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true };
  if (name === 'mic') return <svg {...common}><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3M8 21h8" /></svg>;
  if (name === 'coins') return <svg {...common}><ellipse cx="9" cy="7" rx="6" ry="3" /><path d="M3 7v4c0 1.7 2.7 3 6 3s6-1.3 6-3V7" /><path d="M9 14v3c0 1.7 2.7 3 6 3s6-1.3 6-3v-4c0-1.7-2.7-3-6-3" /></svg>;
  return <svg {...common}><path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4z" /><path d="M7 6H4a3 3 0 0 0 3 4M17 6h3a3 3 0 0 1-3 4" /></svg>;
}

function useCountUp(value, ms = 600) {
  const [shown, setShown] = useState(value);
  const from = useRef(value);
  useEffect(() => {
    const start = performance.now(), a = from.current, b = value;
    if (a === b) return undefined;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { from.current = b; setShown(b); return undefined; }
    let raf = 0;
    const tick = (t) => {
      const p = Math.min(1, (t - start) / ms), e = 1 - Math.pow(1 - p, 3);
      const v = a + (b - a) * e; setShown(v);
      if (p < 1) raf = requestAnimationFrame(tick); else from.current = b;
    };
    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); from.current = b; };
  }, [value, ms]);
  return shown;
}

function InvestmentRound() {
  const [offers, setOffers] = useState({}); // id -> amount being considered
  const [decisions, setDecisions] = useState({}); // id -> { type: 'deal'|'out', amount }
  const [asked, setAsked] = useState({});
  const [burst, setBurst] = useState(null);

  const invested = Object.values(decisions).reduce((s, d) => s + (d.type === 'deal' ? d.amount : 0), 0);
  const remaining = START_FUND - invested;
  const shownRemaining = useCountUp(remaining);
  const allDone = PITCHES.every((p) => decisions[p.id]);
  const deals = PITCHES.filter((p) => decisions[p.id] && decisions[p.id].type === 'deal');

  const offerFor = (p) => (offers[p.id] !== undefined ? offers[p.id] : Math.min(p.ask, remaining));
  const deal = (p) => {
    const amount = offerFor(p);
    if (amount <= 0 || amount > remaining) return;
    setDecisions((d) => ({ ...d, [p.id]: { type: 'deal', amount } }));
    setBurst(p.id);
    setTimeout(() => setBurst(null), 1400);
  };
  const out = (p) => setDecisions((d) => ({ ...d, [p.id]: { type: 'out', amount: 0 } }));
  const reset = () => { setOffers({}); setDecisions({}); setAsked({}); };

  return (
    <div className="ia-round">
      <div className="ia-round-head">
        <div>
          <p className="ia-mono ia-gold">Practice round · sample pitches · play money</p>
          <h3 className="ia-round-title">You're the Investor. Where does your money go?</h3>
        </div>
        <div className="ia-wallet" aria-live="polite">
          <span className="ia-mono">Your portfolio</span>
          <strong>{inr(shownRemaining)}</strong>
          <span className="ia-wallet-bar" aria-hidden="true"><span style={{ width: `${(remaining / START_FUND) * 100}%` }} /></span>
          <span className="ia-mono ia-small">{inr(invested)} invested of {inr(START_FUND)}</span>
        </div>
      </div>

      <div className="ia-pitches">
        {PITCHES.map((p, i) => {
          const d = decisions[p.id];
          const max = Math.max(0, remaining);
          const val = Math.min(offerFor(p), max);
          return (
            <article key={p.id} className={`ia-pitch ${d ? `is-${d.type}` : ''}`} style={{ '--i': i }}>
              <span className="ia-mono ia-small">{p.by}</span>
              <h4>{p.name}</h4>
              <dl>
                <dt>Problem</dt><dd>{p.problem}</dd>
                <dt>Solution</dt><dd>{p.solution}</dd>
                <dt>The ask</dt><dd className="ia-ask">{inr(p.ask)} for {p.equity}% equity</dd>
              </dl>
              <button type="button" className="ia-question" aria-expanded={!!asked[p.id]} onClick={() => setAsked((a) => ({ ...a, [p.id]: !a[p.id] }))}>
                <span aria-hidden="true">?</span> Ask: “{p.question}”
              </button>
              {asked[p.id] && <p className="ia-answer">{p.answer}</p>}

              {!d && (
                <div className="ia-decide">
                  <label className="ia-mono ia-small" htmlFor={`offer-${p.id}`}>Your offer: <b>{inr(val)}</b></label>
                  <input
                    id={`offer-${p.id}`}
                    type="range"
                    min="0"
                    max={max}
                    step={STEP}
                    value={val}
                    onChange={(e) => setOffers((o) => ({ ...o, [p.id]: Number(e.target.value) }))}
                    disabled={max === 0}
                  />
                  <div className="ia-decide-btns">
                    <button type="button" className="ia-btn ia-btn-out" onClick={() => out(p)}>I'm out</button>
                    <button type="button" className="ia-btn ia-btn-deal" onClick={() => deal(p)} disabled={val <= 0}>Make the offer</button>
                  </div>
                  {max === 0 && <p className="ia-mono ia-small">Your portfolio is fully invested.</p>}
                </div>
              )}

              {d && (
                <div className="ia-verdict">
                  <span className={`ia-stamp ${d.type === 'deal' ? 'ia-stamp-deal' : 'ia-stamp-out'}`}>{d.type === 'deal' ? 'Deal!' : "I'm out"}</span>
                  {d.type === 'deal' && <span className="ia-mono ia-small">{inr(d.amount)} invested</span>}
                </div>
              )}
              {burst === p.id && (
                <span className="ia-burst" aria-hidden="true">
                  {Array.from({ length: 14 }).map((_, k) => <i key={k} style={{ '--a': `${k * (360 / 14)}deg`, '--d': `${60 + (k % 3) * 22}px` }} />)}
                </span>
              )}
            </article>
          );
        })}
      </div>

      {allDone && (
        <div className="ia-summary" role="status">
          <p className="ia-mono ia-gold">Round closed</p>
          <p className="ia-summary-line">
            You backed <b>{deals.length}</b> of {PITCHES.length} ideas, invested <b>{inr(invested)}</b> and kept <b>{inr(remaining)}</b> in reserve.
          </p>
          <p className="ia-summary-note">At the real Assembly, Best Investor goes to the sharpest portfolio choices, not the biggest spend. Then you switch sides and pitch.</p>
          <button type="button" className="ia-btn ia-btn-ghost" onClick={reset}>Play the round again</button>
        </div>
      )}
    </div>
  );
}

export default function InnovationAssembly({ onClose, onNavigate }) {
  const rootRef = useRef(null);
  const [swapped, setSwapped] = useState(false);
  const [autoSwap, setAutoSwap] = useState(true);
  const [flipped, setFlipped] = useState({});

  // reveal-on-scroll
  useEffect(() => {
    const root = rootRef.current; if (!root) return undefined;
    const els = root.querySelectorAll('.ia-reveal');
    if (!('IntersectionObserver' in window)) { els.forEach((el) => el.classList.add('is-in')); return undefined; }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); } });
    }, { threshold: 0.18 });
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  // the two seats swap on their own until someone presses the button
  useEffect(() => {
    if (!autoSwap || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    const t = setInterval(() => setSwapped((s) => !s), 3600);
    return () => clearInterval(t);
  }, [autoSwap]);

  const go = (e, path) => { e.preventDefault(); onNavigate(path); };
  const ticker = useMemo(() => ['Pitch', 'Invest', 'Disrupt', 'ROI', 'Valuation', 'Market sizing', 'Term sheets', 'Best Pitch', 'Best Investor', 'Storytelling'], []);

  return (
    <div className="ia" ref={rootRef}>
      <button type="button" className="ia-close" onClick={onClose}>✕ Close</button>

      {/* ============ STAGE ============ */}
      <section className="ia-stage">
        <span className="ia-beam ia-beam-l" aria-hidden="true" />
        <span className="ia-beam ia-beam-r" aria-hidden="true" />
        <span className="ia-floor" aria-hidden="true" />
        <div className="ia-stage-inner">
          <p className="ia-mono ia-kicker"><span className="ia-live" aria-hidden="true" /> Events · 04</p>
          <h1 className="ia-title">
            {'Innovation Assembly'.split(' ').map((w, wi) => (
              <span key={w} className="ia-word" style={{ '--w': wi }}>{w}</span>
            ))}
          </h1>
          <p className="ia-tag">
            <span style={{ '--t': 0 }}>Pitch</span><b aria-hidden="true">·</b>
            <span style={{ '--t': 1 }}>Invest</span><b aria-hidden="true">·</b>
            <span style={{ '--t': 2 }}>Disrupt</span>
          </p>
          <p className="ia-intro">Where students stop studying business, and start doing it.</p>
          <p className="ia-mono ia-gold ia-what">What is Innovation Assembly?</p>
          <p className="ia-lede">Every student has an idea. YANF's Innovation Assembly gives them the stage to prove it. This one-of-a-kind simulation brings the world of entrepreneurship and investment straight to your school, where students pitch real ideas, challenge each other's thinking, and make bold decisions, just like founders and investors do in the real world.</p>
          <div className="ia-actions">
            <a className="ia-btn ia-btn-deal" href="#page-contact" onClick={(e) => go(e, 'page-contact')}>Register interest</a>
            <a className="ia-btn ia-btn-ghost" href="#ia-round" onClick={(e) => { e.preventDefault(); const el = rootRef.current && rootRef.current.querySelector('#ia-round'); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }}>Try the investment round ↓</a>
          </div>
        </div>
        <div className="ia-ticker" aria-hidden="true">
          <div className="ia-ticker-track">
            {[0, 1].map((k) => (
              <span key={k}>{ticker.map((t) => <em key={`${k}-${t}`}>{t}<i>✦</i></em>)}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ============ DUAL EXPERIENCE ============ */}
      <section className="ia-wrap ia-dual ia-reveal">
        <div className="ia-dual-copy">
          <p className="ia-mono ia-gold">The dual experience</p>
          <h2 className="ia-h2">Both sides of the table.</h2>
          <p>What makes it truly special is the dual experience. One student pitches their vision as an Innovator, while another weighs risks and opportunities as an Investor, and then they switch. By the end of it, every participant has lived both sides of the table. The summit crowns its own Best Entrepreneur and Best Investor, making the experience as exciting as it is educational.</p>
          <button type="button" className="ia-btn ia-btn-ghost" onClick={() => { setAutoSwap(false); setSwapped((s) => !s); }}>⇄ Switch sides</button>
        </div>
        <div className={`ia-table ${swapped ? 'is-swapped' : ''}`} aria-live="polite">
          <div className="ia-seat ia-seat-a">
            <span className="ia-seat-icon"><Icon name={swapped ? 'coins' : 'mic'} /></span>
            <span className="ia-mono ia-small">Seat 1</span>
            <strong key={`a${swapped}`} className="ia-role">{swapped ? 'Investor' : 'Innovator'}</strong>
            <span className="ia-seat-line">{swapped ? 'weighs risks and opportunities' : 'pitches their vision'}</span>
          </div>
          <div className="ia-desk" aria-hidden="true"><span>⇄</span></div>
          <div className="ia-seat ia-seat-b">
            <span className="ia-seat-icon"><Icon name={swapped ? 'mic' : 'coins'} /></span>
            <span className="ia-mono ia-small">Seat 2</span>
            <strong key={`b${swapped}`} className="ia-role">{swapped ? 'Innovator' : 'Investor'}</strong>
            <span className="ia-seat-line">{swapped ? 'pitches their vision' : 'weighs risks and opportunities'}</span>
          </div>
          <div className="ia-awards">
            <span className="ia-medal">Best Entrepreneur</span>
            <span className="ia-medal">Best Investor</span>
          </div>
        </div>
      </section>

      {/* ============ WHY ============ */}
      <section className="ia-wrap ia-section">
        <p className="ia-mono ia-gold ia-reveal">Why Innovation Assembly?</p>
        <div className="ia-deck">
          {WHY.map((w, i) => (
            <div key={w} className="ia-slide ia-reveal" style={{ '--i': i }}>
              <span className="ia-slide-no">{String(i + 1).padStart(2, '0')}</span>
              <p>{w}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ============ HOW IT WORKS ============ */}
      <section className="ia-wrap ia-section">
        <p className="ia-mono ia-gold ia-reveal">How it works</p>
        <div className="ia-phases ia-reveal">
          <span className="ia-phase-line" aria-hidden="true"><span /></span>
          {PHASES.map((ph, i) => (
            <article key={ph.no} className="ia-phase" style={{ '--i': i }}>
              <span className="ia-phase-dot"><Icon name={ph.icon} /></span>
              <span className="ia-mono ia-small ia-gold">{ph.no}</span>
              <h3>{ph.title}</h3>
              <p>{ph.text}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ============ PLAYABLE ROUND ============ */}
      <section id="ia-round" className="ia-wrap ia-section ia-reveal">
        <InvestmentRound />
      </section>

      {/* ============ SKILLS ============ */}
      <section className="ia-wrap ia-section">
        <p className="ia-mono ia-gold ia-reveal">Business skills students learn</p>
        <div className="ia-skills">
          {SKILLS.map((s, i) => (
            <button
              key={s.term}
              type="button"
              className="ia-skill ia-reveal"
              data-flipped={flipped[s.term] ? 'true' : 'false'}
              style={{ '--i': i }}
              aria-pressed={!!flipped[s.term]}
              onClick={() => setFlipped((f) => ({ ...f, [s.term]: !f[s.term] }))}
            >
              <span className="ia-skill-inner">
                <span className="ia-skill-front"><b>{s.term}</b><em className="ia-mono ia-small">Tap to reveal</em></span>
                <span className="ia-skill-back"><b>{s.term}:</b> {s.text}</span>
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* ============ HIGHLIGHTS — the term sheet ============ */}
      <section className="ia-wrap ia-section ia-reveal">
        <div className="ia-termsheet">
          <div className="ia-ts-head">
            <span className="ia-mono">Term sheet</span>
            <h3>Event highlights</h3>
            <span className="ia-mono ia-small">YANF · Innovation Assembly</span>
          </div>
          <dl>
            {HIGHLIGHTS.map(([k, v]) => (
              <div key={k}><dt>{k}</dt><dd>{v}</dd></div>
            ))}
          </dl>
          <span className="ia-ts-stamp" aria-hidden="true">Approved</span>
        </div>
      </section>

      {/* ============ CTA ============ */}
      <section className="ia-wrap ia-section ia-reveal">
        <div className="ia-cta">
          <h3>Got an idea? Ready to invest? Join Innovation Assembly at YANF.</h3>
          <a className="ia-btn ia-btn-deal ia-pulse" href="#page-contact" onClick={(e) => go(e, 'page-contact')}>Register interest</a>
        </div>
      </section>

      {/* ============ READING LIST ============ */}
      <section className="ia-wrap ia-section">
        <p className="ia-mono ia-gold ia-reveal">Explore the world of entrepreneurship</p>
        <p className="ia-body ia-reveal">Explore these globally recognised platforms to understand how real entrepreneurs and investors think, pitch, and build businesses.</p>
        <div className="ia-links">
          {LINKS.map(([href, name, text], i) => (
            <a key={href} className="ia-link ia-reveal" style={{ '--i': i }} href={href} target="_blank" rel="noopener noreferrer">
              <b>{name}</b>
              <span>{text}</span>
              <em className="ia-mono ia-small">Visit website →</em>
            </a>
          ))}
        </div>
      </section>

      <footer className="ia-wrap ia-foot">
        <a className="ia-btn ia-btn-ghost" href="#page-about" onClick={(e) => go(e, 'page-about')}>About YANF</a>
        <span className="ia-mono ia-small">YANF · Youth as Nations' Front &nbsp;|&nbsp; Where Potential Meets Purpose.</span>
      </footer>
    </div>
  );
}

// shared with the Assembly redesign (components/assembly/IAPage.jsx)
// eslint-disable-next-line react-refresh/only-export-components
export { InvestmentRound, WHY, PHASES, SKILLS, HIGHLIGHTS, LINKS };
