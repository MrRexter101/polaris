import { onResize } from './scroll-frame.js';

/* A sticky panel taller than the space below the header would keep its foot off screen while stuck.
   This sets --sticky-top to `header + gap`, or lower (negative) when the panel is too tall,
   so its foot stops 16px above the bottom edge. The CSS reads it: top: var(--sticky-top, …). */
export function fitSticky(el, gap = 24) {
  if (!el) return;
  const fit = () => {
    const header = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-h')) || 0;
    el.style.setProperty('--sticky-top', `${Math.min(header + gap, innerHeight - el.offsetHeight - 16)}px`);
  };
  fit();
  document.fonts?.ready.then(fit);
  onResize(fit);
}
