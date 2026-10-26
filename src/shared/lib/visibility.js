import { reduceMotion } from './dom.js';

// Run cb once, the first time el scrolls into view. With reduced motion it runs straight away.
export function onceVisible(el, cb, options = { rootMargin: '0px 0px -15% 0px' }) {
  if (!el) return;
  if (reduceMotion || !('IntersectionObserver' in window)) return cb();
  const io = new IntersectionObserver(([e]) => {
    if (e.isIntersecting) { io.disconnect(); cb(); }
  }, options);
  io.observe(el);
}

/* Background films play only while near the screen and never with reduced motion.
   canPlay(video) lets a caller veto playback (the hero's pause button). */
const filmRules = new Map();
const filmIO = new IntersectionObserver(entries => {
  for (const { target: v, isIntersecting } of entries) {
    if (isIntersecting && !reduceMotion && filmRules.get(v)(v)) {
      if (v.preload === 'none') v.preload = 'auto';
      v.play().catch(() => {});
    } else v.pause();
  }
}, { rootMargin: '200px 0px', threshold: 0 });

export function watchFilm(video, canPlay = () => true) {
  if (!video) return;
  filmRules.set(video, canPlay);
  filmIO.observe(video);
}
