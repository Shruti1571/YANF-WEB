import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SCENES } from '../data/scenes';

gsap.registerPlugin(ScrollTrigger);

export default function VideoFilm({ onNavigate }) {
  const [currentScene, setCurrentScene] = useState(0);
  const [loadedScenes, setLoadedScenes] = useState(new Set([0, 1])); // Preload first 2 scenes
  const layerRefs = useRef([]);
  const captionRefs = useRef([]);
  const kenBurnsTween = useRef(null);

  // Lazy load active and neighboring scenes
  useEffect(() => {
    setLoadedScenes(prev => {
      const next = new Set(prev);
      [currentScene - 1, currentScene, currentScene + 1, currentScene + 2].forEach(idx => {
        if (idx >= 0 && idx < SCENES.length) next.add(idx);
      });
      return next;
    });
  }, [currentScene]);

  useEffect(() => {
    // Register scroll triggers for each section
    const sections = gsap.utils.toArray('#film section.scene');
    const triggers = sections.map((sec, i) => {
      return ScrollTrigger.create({
        trigger: sec,
        start: 'top 55%',
        end: 'bottom 55%',
        onToggle: (self) => {
          if (self.isActive) {
            setCurrentScene(i);
          }
        }
      });
    });

    // Progress bar animation
    const progressTrigger = ScrollTrigger.create({
      trigger: '#film',
      start: 'top top',
      end: 'bottom bottom',
      scrub: 0.4,
      onUpdate: (self) => {
        gsap.set('#progress', { width: `${self.progress * 100}%` });
      }
    });

    // Scroll hint fadeout
    const hintTrigger = ScrollTrigger.create({
      trigger: '#film',
      start: 'top top',
      end: '5% top',
      scrub: true,
      onUpdate: (self) => {
        gsap.set('#scroll-hint', { opacity: 1 - self.progress });
      }
    });

    return () => {
      triggers.forEach(t => t.kill());
      progressTrigger.kill();
      hintTrigger.kill();
    };
  }, []);

  // Snap Scroll implementation
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion || window.matchMedia('(hover: none)').matches) return;

    const GLIDE_TIME = 1.1;
    const GESTURE_GAP = 140;
    const root = document.scrollingElement || document.documentElement;
    const secEls = gsap.utils.toArray('#film section.scene');
    if (!secEls.length) return;

    const maxScroll = () => Math.max(0, root.scrollHeight - window.innerHeight);
    const overlayOpen = () =>
      document.querySelector('.page.open') !== null ||
      document.getElementById('mobile-menu')?.classList.contains('open');

    function targetFor(i) {
      if (i === 0) return 0;
      const sec = secEls[i];
      const t = sec.offsetTop - window.innerHeight * 0.55 + sec.offsetHeight * 0.5;
      return Math.max(0, Math.min(t, maxScroll()));
    }

    function indexAt(pos) {
      const line = pos + window.innerHeight * 0.55;
      for (let i = secEls.length - 1; i >= 0; i--) {
        if (line >= secEls[i].offsetTop) return i;
      }
      return 0;
    }

    let animating = false;
    let lastEvent = 0;

    function goTo(i) {
      i = Math.max(0, Math.min(secEls.length - 1, i));
      animating = true;
      gsap.to(root, {
        scrollTop: targetFor(i),
        duration: GLIDE_TIME,
        ease: 'power2.inOut',
        overwrite: true,
        onComplete: () => { animating = false; },
        onInterrupt: () => { animating = false; }
      });
    }

    function onWheel(e) {
      if (e.ctrlKey || e.defaultPrevented || overlayOpen() || maxScroll() <= 0) return;
      let dy = e.deltaY;
      if (e.deltaMode === 1) dy *= 16;
      else if (e.deltaMode === 2) dy *= window.innerHeight;
      if (!isFinite(dy) || dy === 0) return;

      e.preventDefault();

      const now = performance.now();
      const gap = now - lastEvent;
      lastEvent = now;

      if (animating || gap < GESTURE_GAP) return;
      goTo(indexAt(root.scrollTop) + (dy > 0 ? 1 : -1));
    }

    window.addEventListener('wheel', onWheel, { passive: false });
    return () => window.removeEventListener('wheel', onWheel);
  }, []);

  // Update video playback and caption animations on currentScene change
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    layerRefs.current.forEach((el, j) => {
      if (!el) return;
      const vids = el.tagName === 'VIDEO' ? [el] : Array.from(el.querySelectorAll('video'));

      if (j === currentScene) {
        el.style.zIndex = 2;
        vids.forEach(v => {
          if (v.paused && v.src) v.play().catch(() => {});
        });
        gsap.to(el, { opacity: 1, duration: 1.4, ease: 'power2.inOut' });

        if (!prefersReducedMotion) {
          if (kenBurnsTween.current) kenBurnsTween.current.kill();
          kenBurnsTween.current = gsap.fromTo(el, { scale: 1.0 }, { scale: 1.07, duration: 14, ease: 'none' });
        }
      } else {
        el.style.zIndex = 1;
        gsap.to(el, {
          opacity: 0,
          duration: 1.4,
          ease: 'power2.inOut',
          onComplete: () => {
            vids.forEach(v => v.pause());
          }
        });
      }
    });

    captionRefs.current.forEach((c, j) => {
      if (!c) return;
      if (j === currentScene) {
        gsap.fromTo(c,
          { autoAlpha: 0, y: prefersReducedMotion ? 0 : 46 },
          { autoAlpha: 1, y: 0, duration: prefersReducedMotion ? 0.4 : 1.0, ease: 'power3.out', delay: 0.2, overwrite: 'auto' }
        );
      } else {
        gsap.to(c, {
          autoAlpha: 0, y: prefersReducedMotion ? 0 : -36, duration: 0.5, ease: 'power2.in', overwrite: 'auto'
        });
      }
    });
  }, [currentScene]);

  const handleLink = (e, path) => {
    e.preventDefault();
    onNavigate(path);
  };

  return (
    <>
      <div id="progress"></div>
      <div id="stack">
        {SCENES.map((sc, i) => {
          const isLoaded = loadedScenes.has(i);
          if (sc.src2) {
            return (
              <div
                key={i}
                className="split"
                ref={(el) => (layerRefs.current[i] = el)}
              >
                <video
                  src={isLoaded ? `/${sc.src}` : undefined}
                  muted
                  loop
                  playsInline
                  autoPlay={isLoaded}
                />
                <video
                  src={isLoaded ? `/${sc.src2}` : undefined}
                  muted
                  loop
                  playsInline
                  autoPlay={isLoaded}
                />
              </div>
            );
          }
          return (
            <video
              key={i}
              ref={(el) => (layerRefs.current[i] = el)}
              src={isLoaded ? `/${sc.src}` : undefined}
              muted
              loop
              playsInline
              autoPlay={isLoaded}
            />
          );
        })}
      </div>
      <div id="scrim"></div>

      <div id="scroll-hint">Scroll to begin</div>

      <div id="captions">
        {SCENES.map((sc, i) => (
          <div
            key={i}
            className={`cap-slide ${sc.finale ? 'finale-slide' : ''}`}
          >
            {sc.finale ? (
              <div className="cap" ref={(el) => (captionRefs.current[i] = el)}>
                <div className="quote-mark">A PEACE NOTE — FROM THE YOUTH</div>
                <blockquote>"Peace will not be inherited by the young. It will be <em>negotiated</em> by them — and we intend to be ready."</blockquote>
                <div className="quote-attr">— Youth As Nations' Front</div>
                <div className="cta-row">
                  <a className="btn solid" href="#page-mun" onClick={(e) => handleLink(e, 'page-mun')}>Explore events</a>
                  <a className="btn" href="#page-about" onClick={(e) => handleLink(e, 'page-about')}>About YANF</a>
                </div>
              </div>
            ) : (
              <div className="cap" ref={(el) => (captionRefs.current[i] = el)}>
                {sc.kicker && <div className="kicker">{sc.kicker}</div>}
                {sc.hero ? <h1>{sc.title}</h1> : <h2>{sc.title}</h2>}
                {sc.text && <p>{sc.text}</p>}
              </div>
            )}
          </div>
        ))}
      </div>

      <div id="film">
        {SCENES.map((sc, i) => (
          <section
            key={i}
            id={i === 0 ? 'top' : undefined}
            className={`scene ${sc.short ? 'short' : ''} ${sc.finale ? 'finale' : ''}`}
          />
        ))}
      </div>
    </>
  );
}
