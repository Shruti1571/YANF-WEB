import { useEffect } from 'react';

export const REDUCE = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
export const CONTACT_EMAIL = 'aditya@yanfglobal.com';

/* Adds .in to every .rv element inside root once it enters the viewport */
export function useReveal(rootRef, deps = []) {
  useEffect(() => {
    const root = rootRef.current; if (!root) return undefined;
    const els = root.querySelectorAll('.rv');
    if (REDUCE) { els.forEach(e => e.classList.add('in')); return undefined; }
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: 0.15, rootMargin: '0px 0px -6% 0px' });
    els.forEach(e => io.observe(e));
    return () => io.disconnect();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

export function go(onNavigate, path) {
  return (e) => { if (e) e.preventDefault(); onNavigate(path); };
}

