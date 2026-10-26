import { $ } from '../../../../shared/lib/index.js';

/* The opening voyage: a sail crosses the horizon while the hero film, fonts and first images load
   behind it; then the night parts along the horizon and the page opens. It leaves when the film can play
   (at least 1.7 s, at most 3.6 s), or at once on any scroll, tap or key. boot.js decides whether it runs. */
export function initIntro() {
  const html = document.documentElement;
  const el = $('[data-intro]');
  if (!el) return;
  if (!html.classList.contains('intro-on')) { el.remove(); return; }
  try { sessionStorage.setItem('polaris-intro', '1'); } catch { /* storage blocked */ }

  const wait = ms => new Promise(r => setTimeout(r, ms));
  const film = $('.hero-video');
  const filmReady = new Promise(r => {
    if (!film || film.readyState >= 3) return r();
    film.addEventListener('canplay', r, { once: true });
    film.addEventListener('error', r, { once: true });
  });
  const started = performance.now();
  let gone = false;
  const leave = () => {
    if (gone) return;
    gone = true;
    el.classList.add('is-leaving');
    html.classList.remove('intro-on');          // the hero's own entrance starts as the night parts
    setTimeout(() => el.remove(), 1300);
  };
  Promise.race([Promise.all([filmReady, document.fonts?.ready]), wait(3600)])
    .then(() => wait(Math.max(0, 1700 - (performance.now() - started))))
    .then(leave);
  ['wheel', 'touchstart', 'keydown', 'pointerdown'].forEach(ev => addEventListener(ev, leave, { once: true, passive: true }));
}
