import React, { useEffect, useRef, useState } from 'react';
import { SCENES } from '../data/scenes';

// Program summaries — copy taken verbatim from the event pages in PageOverlays.jsx
const PROGRAMS = [
  {
    no: '01',
    page: 'page-mun',
    name: 'Model United Nations',
    tag: 'Simulate · Debate · Resolve',
    text: "Step into the shoes of the world's diplomats. Model United Nations (MUN) is a globally recognised academic simulation of the United Nations where students represent countries, debate pressing international issues, and draft resolutions — just as real UN delegates do.",
  },
  {
    no: '02',
    page: 'page-debates',
    name: 'Parliamentary Debates',
    tag: 'Argue · Rebut · Persuade',
    text: 'Where the right argument, delivered at the right moment, wins. Parliamentary Debate at YANF is not just a debate — it is a structured battlefield of ideas, logic, and rhetoric where young minds learn to argue with precision, think on their feet, and defend their stance with conviction.',
  },
  {
    no: '03',
    page: 'page-youth-parliament',
    name: 'Youth Parliament — युवा संसद',
    tag: 'Simulate · Legislate · Lead',
    text: 'Experience Indian democracy from the inside. Students step into the roles of Members of Parliament, Chief Ministers, Opposition Leaders, Policy Makers, and Advisors — debating real legislative agendas and experiencing Indian democracy first-hand.',
  },
  {
    no: '04',
    page: 'page-innovation',
    name: 'Innovation Assembly',
    tag: 'Pitch · Invest · Disrupt',
    text: "Where students stop studying business — and start doing it. Every student has an idea. YANF's Innovation Assembly gives them the stage to prove it.",
  },
];

const INNOVATION_PHASES = [
  {
    step: 'Phase 1',
    title: 'The Innovation Pitch',
    text: 'Students assigned as Innovators develop and present a business idea to a panel of student Investors — covering the problem, the solution, target audience, business model, and growth plan.',
  },
  {
    step: 'Phase 2',
    title: 'The Investment Round',
    text: 'Students assigned as Investors evaluate pitches, ask probing questions, and decide where to allocate their virtual investment portfolio.',
  },
  {
    step: 'Phase 3',
    title: 'The Summit Awards',
    text: 'The summit crowns the Best Entrepreneur — whose idea won the most investment and admiration — and the Best Investor — whose portfolio choices showed the sharpest business acumen.',
  },
];

// Group the scroll-film captions (data/scenes.js) into acts, skipping the hero and finale
function groupActs(scenes) {
  const acts = [];
  scenes.forEach((sc) => {
    if (sc.hero || sc.finale) return;
    const last = acts[acts.length - 1];
    if (last && last.act === sc.act && last.actName === sc.actName) {
      last.items.push(sc);
    } else {
      acts.push({ act: sc.act, actName: sc.actName, items: [sc] });
    }
  });
  return acts;
}

const HERO = SCENES.find((s) => s.hero) || SCENES[0];
const ACTS = groupActs(SCENES);

export default function Landing({ onNavigate }) {
  const [signature, setSignature] = useState('');
  const rootRef = useRef(null);

  // Gentle fade-up as sections enter the viewport
  useEffect(() => {
    const els = rootRef.current ? rootRef.current.querySelectorAll('.rz-reveal') : [];
    if (!('IntersectionObserver' in window)) {
      els.forEach((el) => el.classList.add('is-in'));
      return undefined;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-in');
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  const go = (e, path) => {
    e.preventDefault();
    onNavigate(path);
  };

  return (
    <main id="top" className="rz" ref={rootRef}>
      {/* ============ HERO ============ */}
      <section className="rz-wrap rz-hero">
        <div className="rz-hero-copy">
          <p className="rz-mono">Draft resolution · YANF/001</p>
          <p className="rz-kicker">{HERO.kicker}</p>
          <h1 className="rz-h1">
            The world is a negotiation. <span className="rz-accent">Learn to sit at the table.</span>
          </h1>
          <p className="rz-lede">{HERO.text}</p>
          <div className="rz-actions">
            <a className="rz-btn rz-btn-solid" href="#page-mun" onClick={(e) => go(e, 'page-mun')}>Explore events</a>
            <a className="rz-btn" href="#page-about" onClick={(e) => go(e, 'page-about')}>About YANF</a>
          </div>
        </div>

        <div className="rz-hero-doc">
          <div className="rz-doc">
            <p className="rz-mono rz-doc-head">The General Assembly of Youth,</p>
            <p><em>Recognising</em> that every fleet is a foreign policy,</p>
            <p><em>Noting</em> that a map is an argument,</p>
            <p><em>Aware</em> that water is leverage,</p>
            <p><em>Convinced</em> that technology is policy now,</p>
            <p><strong>1.</strong> <u>Affirms</u> that the classroom is the first assembly;</p>
            <p><strong>2.</strong> <u>Calls upon</u> students to rehearse improving the world order — question by question, motion by motion;</p>
            <p><strong>3.</strong> <u>Declares</u> that peace will not be inherited by the young. It will be negotiated by them.</p>
            <div className="rz-doc-sign">
              <label className="rz-mono" htmlFor="rz-sign">Co-sponsor</label>
              <div className="rz-sign-field">
                <input
                  id="rz-sign"
                  type="text"
                  maxLength={40}
                  autoComplete="name"
                  placeholder="Type your name to sign"
                  value={signature}
                  onChange={(e) => setSignature(e.target.value)}
                />
                <span className="rz-signature" aria-hidden="true">{signature}</span>
              </div>
            </div>
            {signature.trim() && (
              <a className="rz-sign-cta" href="#page-contact" onClick={(e) => go(e, 'page-contact')}>
                Signed, {signature.trim()}. Take a seat at the table →
              </a>
            )}
          </div>
          <span className="rz-note rz-note-hero" aria-hidden="true">↑ that's you</span>
        </div>
      </section>

      {/* ============ PREAMBULAR CLAUSES — the scroll-film captions ============ */}
      <section className="rz-wrap rz-section">
        <p className="rz-mono rz-section-label rz-reveal">Preambular clauses — the world we study</p>
        {ACTS.map((act) => (
          <article className="rz-act rz-reveal" key={`${act.act}-${act.actName}`}>
            <header className="rz-act-head">
              
              <h2>{act.actName}</h2>
            </header>
            <div className="rz-act-body">
              {act.items.map((sc) => (
                <div className="rz-clause" key={sc.src}>
                  <h3>{sc.title}</h3>
                  {sc.text && <p>{sc.text}</p>}
                </div>
              ))}
            </div>
          </article>
        ))}
      </section>

      {/* ============ OPERATIVE CLAUSES — the four events ============ */}
      <section id="events" className="rz-wrap rz-section">
        <p className="rz-mono rz-section-label rz-reveal">Operative clauses — four ways to take the floor</p>
        {PROGRAMS.map((p) => (
          <a key={p.page} className="rz-program rz-reveal" href={`#${p.page}`} onClick={(e) => go(e, p.page)}>
            <span className="rz-mono rz-program-no">Events · {p.no}</span>
            <span className="rz-program-name">
              {p.name}
              <span className="rz-mono rz-program-tag">{p.tag}</span>
            </span>
            <span className="rz-program-text">{p.text}</span>
            <span className="rz-mono rz-program-go">Read →</span>
          </a>
        ))}
      </section>

      {/* ============ AMENDMENT — Innovation Assembly ============ */}
      <section className="rz-wrap rz-section">
        <div className="rz-amend rz-reveal">
          <div className="rz-amend-head">
            <div>
              <p className="rz-mono rz-blue">Amendment proposed · Events · 04</p>
              <h2>Innovation Assembly</h2>
            </div>
            <span className="rz-note" aria-hidden="true">Pitch · Invest · Disrupt</span>
          </div>
          <p className="rz-amend-lede">
            What makes it truly special is the dual experience. One student pitches their vision as an Innovator, while
            another weighs risks and opportunities as an Investor — and then they switch. By the end of it, every
            participant has lived both sides of the table.
          </p>
          <div className="rz-phases">
            {INNOVATION_PHASES.map((ph) => (
              <div className="rz-phase" key={ph.step}>
                <span className="rz-mono">{ph.step}</span>
                <h3>{ph.title}</h3>
                <p>{ph.text}</p>
              </div>
            ))}
          </div>
          <div className="rz-actions">
            <a className="rz-btn rz-btn-solid" href="#page-innovation" onClick={(e) => go(e, 'page-innovation')}>Read the full amendment</a>
            <a className="rz-btn" href="#page-contact" onClick={(e) => go(e, 'page-contact')}>Register interest</a>
          </div>
        </div>
      </section>

      {/* ============ FINALE — the peace note ============ */}
      <section className="rz-wrap rz-finale rz-reveal">
        <p className="rz-mono">A peace note — from the youth</p>
        <blockquote className="rz-quote">
          “Peace will not be inherited by the young. It will be <em>negotiated</em> by them — and we intend to be ready.”
        </blockquote>
        <p className="rz-mono rz-quote-attr">— Youth As Nations' Front</p>
        <div className="rz-actions rz-actions-center">
          <a className="rz-btn rz-btn-solid" href="#page-mun" onClick={(e) => go(e, 'page-mun')}>Explore events</a>
          <a className="rz-btn" href="#page-about" onClick={(e) => go(e, 'page-about')}>About YANF</a>
        </div>
      </section>

      <footer className="rz-wrap rz-footer">
        <span>YANF — Youth as Nations' Front &nbsp;|&nbsp; Where Potential Meets Purpose.</span>
        <nav className="rz-footer-links" aria-label="Footer">
          <a href="#page-certificates" onClick={(e) => go(e, 'page-certificates')}>Certificates</a>
          <a href="#page-blogs" onClick={(e) => go(e, 'page-blogs')}>Blogs</a>
          <a href="#page-resources" onClick={(e) => go(e, 'page-resources')}>Resources</a>
          <a href="#page-contact" onClick={(e) => go(e, 'page-contact')}>Contact</a>
        </nav>
      </footer>
    </main>
  );
}
