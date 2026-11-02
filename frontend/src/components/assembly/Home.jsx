import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { mountScenes, P } from './scenes';
import { CHAMBERS, SPOTS, SPOTS_PH } from './objects';
import { Painter, AssemblyFooter } from './common';
import { REDUCE, go } from './utils';

gsap.registerPlugin(ScrollTrigger);

const PAGES = ['page-mun', 'page-debates', 'page-youth-parliament', 'page-innovation'];
const isPhone = () => window.innerWidth < 760;
let introPlayed = false;

const CARDS = [
  ['page-mun', 'flags', 'Represent', 'Model United Nations', 'Grade 7 onwards', 'A vaulted hall lined with waving national flags'],
  ['page-debates', 'debate', 'Argue', 'Parliamentary Debates', 'Asian & British Parliamentary', 'Two lecterns under spotlights with a voice waveform between them'],
  ['page-youth-parliament', 'hemicycle', 'Legislate', 'Yuva Sansad · युवा संसद', 'Democracy from the inside', 'A parliament hemicycle seen from above, seats lighting up as members vote'],
  ['page-innovation', 'pitch', 'Pitch', 'Innovation Assembly', 'Grade 9 onwards', 'A pitch stage with a rising growth chart'],
];

export default function Home({ onNavigate, paused }) {
  const root = useRef(null);
  const ctl = useRef({});
  const spots = isPhone() ? SPOTS_PH : SPOTS;

  /* scenes + scroll film */
  useEffect(() => {
    const el = root.current;
    const scenes = mountScenes(el);
    ctl.current.scenes = scenes;
    const vid = el.querySelector('#pourVid');
    vid.playbackRate = 0.8;
    const vio = new IntersectionObserver(es => es.forEach(e => { if (REDUCE) return; if (e.isIntersecting && !ctl.current.paused) vid.play().catch(() => {}); else vid.pause(); }));
    vio.observe(vid);
    if (REDUCE) { el.querySelector('.as-curtain')?.remove(); return () => { vio.disconnect(); scenes.destroy(); }; }

    const lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 0.9, prevent: (node) => !!node.closest?.('.page, .as-menu') });
    ctl.current.lenis = lenis;
    lenis.on('scroll', ScrollTrigger.update);
    const tick = (t) => lenis.raf(t * 1000);
    gsap.ticker.add(tick); gsap.ticker.lagSmoothing(0);

    const ctx = gsap.context(() => {
      const ST = (sel, tl, extra = {}) => {
        const key = sel.slice(1), user = extra.onUpdate;
        return ScrollTrigger.create(Object.assign({ trigger: sel, start: 'top top', end: 'bottom bottom', scrub: true, animation: tl }, extra, { onUpdate: s => { P[key] = s.progress; if (user) user(s); } }));
      };
      // intro (once per visit)
      const curtain = el.querySelector('.as-curtain');
      if (!introPlayed) {
        introPlayed = true;
        gsap.timeline()
          .from('.as-curtain b', { opacity: 0, letterSpacing: '1.2em', duration: 1, ease: 'power3.out' })
          .to(curtain, { yPercent: -100, duration: 1.1, ease: 'power4.inOut' }, '+=.25')
          .set(curtain, { display: 'none' })
          .from('.hero-word span', { yPercent: 40, opacity: 0, filter: 'blur(14px)', stagger: 0.09, duration: 1.3, ease: 'power3.out' }, '-=.6')
          .from('.hero-eyebrow, #cue', { opacity: 0, y: 12, duration: 0.8 }, '-=.8');
      } else gsap.set(curtain, { display: 'none' });

      // 1 hero
      { const tl = gsap.timeline({ defaults: { ease: 'none' } });
        tl.to('.hero-word span', { x: i => (i - 1.5) * (isPhone() ? 6 : 9) * window.innerWidth / 100, opacity: 0, filter: 'blur(10px)', duration: 0.4 }, 0)
          .to('.hero-eyebrow, #cue', { opacity: 0, duration: 0.12 }, 0)
          .fromTo('#cap1', { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.14 }, 0.14).to('#cap1', { opacity: 0, y: -30, duration: 0.12 }, 0.5)
          .fromTo('#cap2', { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.14 }, 0.56).to('#cap2', { opacity: 0, duration: 0.1 }, 0.9);
        ST('#hero', tl); }
      // 2 pour
      { const tl = gsap.timeline({ defaults: { ease: 'none' } });
        tl.fromTo('#pourVid', { scale: 1.14 }, { scale: 1, duration: 0.62 }, 0)
          .from('#pourCopy .as-eyebrow', { opacity: 0, duration: 0.08 }, 0.06)
          .from('#pourCopy .line > span', { yPercent: 110, stagger: 0.05, duration: 0.14, ease: 'power2.out' }, 0.08)
          .to('#pourCopy', { opacity: 0, duration: 0.1 }, 0.58)
          .to('#pourFrame', { scale: () => (isPhone() ? 0.82 : 0.6), y: () => -window.innerHeight * 0.06, borderRadius: 28, duration: 0.32, ease: 'power2.inOut' }, 0.62)
          .from('#pourAfter', { opacity: 0, y: 30, duration: 0.12 }, 0.86);
        ST('#pour', tl); }
      // 3 colour swap
      { const tl = gsap.timeline({ defaults: { ease: 'none' } });
        const layers = [...el.querySelectorAll('.layer')], idx = [...el.querySelectorAll('#swapIndex span')]; const D = 4;
        layers.forEach((L, i) => {
          if (i) tl.fromTo(L, { clipPath: 'circle(0% at 88% 50%)' }, { clipPath: 'circle(150% at 88% 50%)', duration: 0.75, ease: 'power2.inOut' }, i - 0.45);
          tl.fromTo(L.querySelector('.bigword'), { xPercent: -44, yPercent: -50 }, { xPercent: -56, yPercent: -50, duration: 1.6 }, Math.max(0, i - 0.5));
          L.querySelectorAll('.float').forEach(f => tl.fromTo(f, { y: () => +f.dataset.speed * 120 }, { y: () => -f.dataset.speed * 120, duration: 1.6 }, Math.max(0, i - 0.5)));
        });
        tl.to({}, { duration: 0.3 }, D - 0.3);
        ST('#swap', tl, { onUpdate: s => { const k = Math.min(3, Math.floor(s.progress * D * 1.02 + 0.02)); idx.forEach((e, j) => e.classList.toggle('on', j === k)); } }); }
      // 4 still
      { const tl = gsap.timeline({ defaults: { ease: 'none' } });
        tl.fromTo('#gl-still', { scale: 1.06 }, { scale: 1, duration: 1 }, 0)
          .from('#stillL', { x: -120, opacity: 0, duration: 0.25, ease: 'power2.out' }, 0.05)
          .from('#stillR', { x: 120, opacity: 0, duration: 0.25, ease: 'power2.out' }, 0.22)
          .fromTo('#blob', { scale: 0, rotate: -30 }, { scale: () => Math.hypot(window.innerWidth, window.innerHeight) / (Math.max(window.innerWidth, window.innerHeight) * 0.6 * 0.62), rotate: 40, duration: 0.3, ease: 'power2.in' }, 0.68);
        ST('#still', tl); }
      // 5 glass
      gsap.set('.card-wrap, #joinCard', { xPercent: -50, yPercent: -50, x: 0, y: 0 });
      { const tl = gsap.timeline({ defaults: { ease: 'none' } });
        const states = [...el.querySelectorAll('.gstate')];
        const rect = () => { const r = el.querySelector('#gcard').getBoundingClientRect(); return `inset(${r.top}px ${window.innerWidth - r.right}px ${window.innerHeight - r.bottom}px ${r.left}px round 26px)`; };
        tl.fromTo('#redveil', { clipPath: 'inset(0px 0px 0px 0px round 0px)' }, { clipPath: rect, duration: 0.5, ease: 'power2.inOut' }, 0)
          .to('#redveil', { opacity: 0, duration: 0.25 }, 0.45)
          .from('#gcard', { scale: 0.9, opacity: 0, duration: 0.3 }, 0.45)
          .from('#glassHead', { opacity: 0, y: 20, duration: 0.25 }, 0.5);
        for (let i = 1; i < 4; i++) tl.to(states[i - 1], { opacity: 0, y: -20, duration: 0.2 }, i + 0.35).fromTo(states[i], { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.25 }, i + 0.5);
        tl.fromTo('#gcard', { rotateY: -16, rotateX: 6 }, { rotateY: 16, rotateX: -4, duration: 1, ease: 'sine.inOut', yoyo: true, repeat: 3 }, 0.6)
          .fromTo('#gcard', { '--sheen': '-60%' }, { '--sheen': '60%', duration: 1, yoyo: true, repeat: 3 }, 0.6)
          .to('#glassHead', { opacity: 0, duration: 0.3 }, 4.3);
        ST('#glass', tl); }
      // 6 chambers
      { const track = el.querySelector('#track'), cards = [...track.children], heads = [...el.querySelectorAll('#chHead span')];
        const geo = () => { const cw = cards[0].offsetWidth, gap = parseFloat(getComputedStyle(track).columnGap) || 0; return { cw, ch: cards[0].offsetHeight, last: (cards.length - 1) * (cw + gap) + cw / 2 }; };
        gsap.set(track, { yPercent: -50 });
        const tl = gsap.timeline({ defaults: { ease: 'none' } });
        tl.fromTo(track, { x: () => window.innerWidth * (isPhone() ? 0.95 : 0.62) }, { x: () => window.innerWidth / 2 - geo().last, duration: 0.74, ease: 'power1.inOut' }, 0)
          .to('#chHead', { opacity: 0, duration: 0.06 }, 0.76)
          .to(cards[cards.length - 1].querySelectorAll('h4, small'), { opacity: 0, duration: 0.06 }, 0.8)
          .to(track, { scale: () => { const g = geo(); return Math.max(window.innerWidth / g.cw, window.innerHeight / g.ch) * 1.02; }, transformOrigin: () => `${geo().last}px 50%`, '--rad': '0px', duration: 0.18, ease: 'power2.inOut' }, 0.78)
          .to('#chFinal', { opacity: 1, duration: 0.08 }, 0.9);
        ST('#chambers', tl, { invalidateOnRefresh: true, onUpdate: () => {
          let best = 0, bd = 1e9; const mid = window.innerWidth / 2;
          cards.forEach((c, i) => { const r = c.getBoundingClientRect(); const d = Math.abs(r.left + r.width / 2 - mid); if (d < bd) { bd = d; best = i; }
            const k = Math.min(1, d / (window.innerWidth * 0.7)); gsap.set(c, { scale: 1 - k * 0.16, rotateY: (r.left + r.width / 2 < mid ? 1 : -1) * k * 10, transformPerspective: 1400, opacity: 1 - k * 0.55 }); });
          heads.forEach((h, i) => h.classList.toggle('on', i === best)); } }); }
      // 7 voices
      { const tl = gsap.timeline({ defaults: { ease: 'none' } });
        tl.fromTo('#panelA canvas', { scale: 1.16 }, { scale: 1, duration: 0.55 }, 0)
          .fromTo('#giantA', { yPercent: -30 }, { yPercent: -70, duration: 0.55 }, 0)
          .from('#whA', { opacity: 0, x: -40, duration: 0.12 }, 0.06)
          .fromTo('#panelB', { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.2, ease: 'power2.inOut' }, 0.45)
          .fromTo('#panelB canvas', { scale: 1.25 }, { scale: 1, duration: 0.55 }, 0.45)
          .fromTo('#giantB', { yPercent: -20 }, { yPercent: -70, duration: 0.55 }, 0.45)
          .from('#whB', { opacity: 0, x: 40, duration: 0.12 }, 0.62);
        ST('#voices', tl); }
      // 8 born
      el.querySelectorAll('.trip figure').forEach((f, i) => {
        gsap.fromTo(f, { y: 80 * (i + 1) }, { y: -60 * (i + 1), ease: 'none', scrollTrigger: { trigger: '#born', start: 'top bottom', end: 'bottom top', scrub: true } });
        gsap.fromTo(f.querySelector('canvas'), { yPercent: -6 }, { yPercent: 6, ease: 'none', scrollTrigger: { trigger: f, start: 'top bottom', end: 'bottom top', scrub: true } });
      });
      gsap.from('#born h2', { opacity: 0, y: 60, duration: 1.2, ease: 'power3.out', scrollTrigger: { trigger: '#born', start: 'top 70%' } });
      // 9 choose
      gsap.from('.pcard', { y: 90, opacity: 0, stagger: 0.12, duration: 1.1, ease: 'power3.out', scrollTrigger: { trigger: '#chooser', start: 'top 80%' } });
      gsap.from('#choose header > *', { y: 40, opacity: 0, stagger: 0.1, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: '#choose', start: 'top 70%' } });
      // 10 join
      { const tl = gsap.timeline({ defaults: { ease: 'none' } });
        tl.fromTo('#join .stage', { clipPath: 'circle(18% at 50% 50%)' }, { clipPath: 'circle(75% at 50% 50%)', duration: 0.4, ease: 'power2.inOut' }, 0)
          .fromTo('#gl-join', { scale: 1.15 }, { scale: 1, duration: 1 }, 0)
          .from('#joinCard', { opacity: 0, y: 60, scale: 0.92, duration: 0.25, ease: 'power2.out' }, 0.35);
        ST('#join', tl, { start: 'top bottom' }); }
    }, el);

    const tilt = (e) => { const x = e.clientX / window.innerWidth - 0.5, y = e.clientY / window.innerHeight - 0.5; gsap.to(el.querySelector('.card-wrap'), { rotateY: x * 10, rotateX: -y * 8, duration: 0.8, ease: 'power2.out' }); };
    window.addEventListener('pointermove', tilt);
    let rw = window.innerWidth; let rt = 0;
    const onResize = () => { clearTimeout(rt); rt = setTimeout(() => { if (Math.abs(window.innerWidth - rw) > 120) { rw = window.innerWidth; ScrollTrigger.refresh(); } }, 200); };
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('pointermove', tilt); window.removeEventListener('resize', onResize);
      ctx.revert(); gsap.ticker.remove(tick); lenis.destroy(); vio.disconnect(); scenes.destroy();
    };
  }, []);

  /* pause everything while an inner page is open */
  useEffect(() => {
    ctl.current.paused = paused;
    ctl.current.scenes?.setPaused(paused);
    const v = root.current?.querySelector('#pourVid');
    if (paused) { ctl.current.lenis?.stop(); v?.pause(); }
    else { ctl.current.lenis?.start(); ScrollTrigger.refresh(); }
  }, [paused]);

  const scrollTo = (sel) => (e) => { e.preventDefault(); const t = root.current.querySelector(sel); if (ctl.current.lenis) ctl.current.lenis.scrollTo(t, { duration: 1.6 }); else t.scrollIntoView({ behavior: 'smooth' }); };

  return (
    <div className="as-home" ref={root}>
      <div className="as-curtain" aria-hidden="true"><b>YANF</b></div>

      {/* 1 HERO */}
      <section className="sec" id="hero">
        <div className="stage">
          <div className="as-full" data-gl="hero" role="img" aria-label="A live 3D night Earth with glowing cities and diplomatic routes, turning as you scroll" />
          <div className="shade" />
          <p className="hero-eyebrow as-eyebrow">Youth As Nations' Front</p>
          <h1 className="hero-word" aria-label="YANF"><span>Y</span><span>A</span><span>N</span><span>F</span></h1>
          <div className="hcap l" id="cap1"><p>A single planet.<br />Argued over, every day.</p><small>Model UN, debate, Youth Parliament and the Innovation Assembly, for students who want to understand the world, not just read about it.</small></div>
          <div className="hcap r" id="cap2"><p>Somebody has to sit<br />at the table.</p><small>Why not you?</small></div>
          <a className="scrollcue as-eyebrow" id="cue" href="#pour" onClick={scrollTo('#pour')}>Scroll<i /></a>
        </div>
      </section>

      {/* 2 POUR */}
      <section className="sec" id="pour">
        <div className="stage">
          <div className="pour-frame" id="pourFrame">
            <video className="as-full" id="pourVid" src="/assembly/media/oil-pour.mp4" poster="/assembly/media/oil-pour.jpg" muted loop playsInline autoPlay={!REDUCE} preload="auto" aria-label="Golden oil pouring into a tank in slow motion" />
            <div className="shade" />
            <div className="pour-copy" id="pourCopy">
              
              <h2><span className="line"><span>Power,</span></span><span className="line"><span><em>before</em></span></span><span className="line"><span>politics.</span></span></h2>
              <p className="line"><span>Every barrel, every watt and every river is a negotiation. YANF delegates learn the economics underneath the headlines.</span></p>
            </div>
          </div>
          <div className="pour-after" id="pourAfter"><p>A map is an argument. <em>Learn to read it like an analyst.</em></p></div>
        </div>
      </section>

      {/* 3 COLOUR SWAP */}
      <section className="sec" id="swap" aria-label="The four YANF programs">
        <div className="stage">
          {CHAMBERS.map((c, i) => (
            <div key={c.word} className="layer" style={{ background: c.col, clipPath: i ? 'circle(0% at 88% 50%)' : undefined }}>
              <div className="glow" />
              <div className="bigword">{c.word}</div>
              {c.items.map((svg, k) => (
                <div key={k} className="float" data-speed={spots[k][3]} style={{ left: `${spots[k][0]}%`, top: `${spots[k][1]}%`, width: spots[k][2] }}>
                  <div style={{ '--t': `${5 + (k % 4)}s`, '--r0': `${-4 - k}deg`, '--r1': `${4 + (k % 3) * 3}deg` }} dangerouslySetInnerHTML={{ __html: svg }} />
                </div>
              ))}
              <div className="swap-copy">
                <span className="as-eyebrow">{c.tag}</span><h3>{c.name}</h3><p>{c.text}</p>
                <a className="pill" href={`#${PAGES[i]}`} onClick={go(onNavigate, PAGES[i])}>Explore →</a>
              </div>
            </div>
          ))}
          <div className="medal-shadow" />
          <div className="as-full" data-gl="swap" style={{ zIndex: 4, pointerEvents: 'none' }} aria-hidden="true" />
          <div className="swap-index" id="swapIndex">{CHAMBERS.map((c, i) => <span key={c.short} className={i ? '' : 'on'}>0{i + 1} {c.short}</span>)}</div>
        </div>
      </section>

      {/* 4 STILL */}
      <section className="sec" id="still">
        <div className="stage">
          <div className="as-full" id="gl-still" data-gl="still" role="img" aria-label="Wind turbines on a sea at dusk, rendered live" />
          <div className="shade" />
          <p className="still-l" id="stillL">Nothing<br /><em>scripted.</em></p>
          <p className="still-r" id="stillR">Everything<br /><em>argued.</em></p>
          <svg className="blob" id="blob" viewBox="0 0 200 200" aria-hidden="true"><path fill="#a12a1c" d="M100 14c22 0 30 18 48 22s38 6 40 30-14 30-10 50 12 40-6 54-34 2-52 10-30 22-52 14-18-30-32-42-34-14-34-36 22-28 26-46 6-38 26-46 24-10 46-10z" /></svg>
        </div>
      </section>

      {/* 5 GLASS */}
      <section className="sec" id="glass">
        <div className="stage">
          <div className="as-full" data-gl="glass" role="img" aria-label="Energy scenes rendered live: an atom, a water ripple, crude oil, undersea cables" />
          <div className="shade" />
          <div className="redveil" id="redveil" />
          <div className="glass-head" id="glassHead"><p>What keeps a country's lights on is what keeps its diplomats up at night.</p></div>
          <div className="card-wrap"><div className="gcard" id="gcard">
            <div className="gstate first"><h3>Atom</h3><i /><div><span className="as-eyebrow">Nuclear</span><p>Split one atom and you can power a city. Treaties decide who is allowed to.</p></div></div>
            <div className="gstate"><h3>Water</h3><i /><div><span className="as-eyebrow">Hydro</span><p>Rivers cross borders. So do the arguments about who gets to dam them.</p></div></div>
            <div className="gstate"><h3>Crude</h3><i /><div><span className="as-eyebrow">Oil &amp; gas</span><p>The price of a barrel can move elections on three continents.</p></div></div>
            <div className="gstate"><h3>Signal</h3><i /><div><span className="as-eyebrow">Undersea cables</span><p>Most of the internet travels along the sea floor. Someone has to protect it.</p></div></div>
          </div></div>
        </div>
      </section>

      {/* 6 CHAMBERS */}
      <section className="sec" id="chambers">
        <div className="stage">
          <h2 className="ch-head" id="chHead"><span className="on">Represent.</span><span>Argue.</span><span>Legislate.</span><span><em>Pitch.</em></span></h2>
          <div className="track" id="track">
            {CARDS.map(([p, kind, word, name, fact, label]) => (
              <a key={p} className="ccard" href={`#${p}`} onClick={go(onNavigate, p)}>
                <Painter kind={kind} label={label} /><div className="shade" /><h4>{word}</h4><small>{name}<br />{fact}</small>
              </a>
            ))}
          </div>
          <div className="ch-final" id="chFinal"><p>The floor<br /><em>is yours.</em></p></div>
        </div>
      </section>

      {/* 7 VOICES */}
      <section className="sec" id="voices">
        <div className="stage">
          <div className="panel" id="panelA">
            <Painter kind="dotglobe" label="A dotted golden globe turning on deep blue" />
            <div className="shade" />
            <p className="giant" id="giantA">World<br />Order</p>
            <p className="whisper" id="whA">a seat at the table<br />is earned<br />in the room.</p>
          </div>
          <div className="panel" id="panelB" style={{ clipPath: 'inset(100% 0 0 0)' }}>
            <Painter kind="sparks" label="Sparks rising over a dawn horizon" />
            <div className="shade" />
            <p className="giant left" id="giantB">Next<br />Gen</p>
            <p className="whisper right" id="whB">Can you hear<br />the room?</p>
          </div>
        </div>
      </section>

      {/* 8 BORN */}
      <section id="born">
        <h2>Born in classrooms. <em>Raised in assemblies.</em></h2>
        <div className="trip">
          <figure><div className="vf"><Painter kind="roundtable" className="" label="A round negotiating table seen from above" /></div><figcaption><span>Global governance</span><span>01</span></figcaption></figure>
          <figure><div className="vf"><Painter kind="sapling" className="" label="A sapling growing in the sun" /></div><figcaption><span>Climate action</span><span>02</span></figcaption></figure>
          <figure><div className="vf"><Painter kind="network" className="" label="A glowing molecular network" /></div><figcaption><span>Science &amp; health</span><span>03</span></figcaption></figure>
        </div>
      </section>

      {/* 9 CHOOSE */}
      <section id="choose">
        <header><h2>Choose your <em>chamber.</em></h2><p>Four programs, one habit of mind: the confidence to ask, the discipline to understand, the courage to lead.</p></header>
        <div className="chooser" id="chooser">
          {CHAMBERS.map((c, i) => (
            <article key={c.word} className="pcard" style={{ '--c': c.col }}>
              <a className="top" href={`#${PAGES[i]}`} onClick={go(onNavigate, PAGES[i])} aria-label={`Open ${c.name}`}>
                <span className="glow" />
                <span className="mini" style={{ left: '50%', top: 22, width: 110, marginLeft: -55 }} dangerouslySetInnerHTML={{ __html: c.items[i === 3 ? 0 : 2] }} />
                <span className="mini" style={{ left: 14, top: 30, width: 58 }} dangerouslySetInnerHTML={{ __html: c.items[1] }} />
                <span className="mini" style={{ right: 12, top: 58, width: 62 }} dangerouslySetInnerHTML={{ __html: c.items[4] }} />
                <b>{c.word}</b>
              </a>
              <div className="body"><span>{c.tag}</span><h3>{c.name}</h3><p>{c.text}</p><span>{c.facts}</span>
                <div className="pcard-actions">
                  <a className="pill" href={`#page-contact?program=${PAGES[i]}`} onClick={go(onNavigate, `page-contact?program=${PAGES[i]}`)}>Register →</a>
                  <a className="pcard-more" href={`#${PAGES[i]}`} onClick={go(onNavigate, PAGES[i])}>Details</a>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* 10 JOIN */}
      <section className="sec" id="join">
        <div className="stage">
          <div className="as-full" id="gl-join" data-gl="join" role="img" aria-label="The Earth at night with diplomatic routes, rendered live" />
          <div className="shade" />
          <div className="join-card" id="joinCard">
            <img src="/brand/yanf-mark-reversed.svg" alt="YANF" />
            <h2>Join the <em>assembly.</em></h2>
            <p>Registrations for the next session are open. Bring a question; leave with a position.</p>
            <a className="btn-solid" href="#page-contact" onClick={go(onNavigate, 'page-contact')}>Register interest</a>
          </div>
        </div>
      </section>

      <AssemblyFooter onNavigate={onNavigate} />
    </div>
  );
}
