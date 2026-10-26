import { $, $$, clamp01, onResize, onScrollFrame } from '../../../../shared/lib/index.js';
import { glideTo, pageTop } from './settle.js';

/* Section stacking (laptops and desktops): each fitted section holds under the header while the next one
   slides over it, and the covered section dims softly (stack.css). The same query is in stack.css. */
const QUERY = '(min-width: 1081px) and (min-height: 720px) and (prefers-reduced-motion: no-preference)';

export function initStack() {
  const mq = matchMedia(QUERY);
  const header = $('.site-header');
  const main = $('#main');
  // the fitted sections; How it works pins itself (voyage.js), and the questions are last, with only the short
  // footer to follow, which would never cover them
  const stacks = $$('.section.screen:not(.how-sec, .faq-sec), #consult', main).filter(s => !s.hidden);
  const next = s => {
    let n = s.nextElementSibling;
    while (n?.hidden) n = n.nextElementSibling;
    return n ?? $('.paybar');
  };
  let on = false;

  // a section taller than the screen holds only once its foot is in view, so none of it is ever hidden
  const fit = () => stacks.forEach(s => s.style.setProperty('--stick-top', `${Math.min(header.offsetHeight, innerHeight - s.offsetHeight)}px`));
  const ro = new ResizeObserver(() => on && fit());

  function set(v) {
    on = v;
    for (const s of stacks) {
      s.classList.toggle('is-stacked', v);
      next(s)?.classList.toggle('stack-over', v);
      if (v && !$(':scope > .stack-veil', s)) s.append(Object.assign(document.createElement('div'), { className: 'stack-veil' }));
      if (v) ro.observe(s); else s.style.removeProperty('--cover');
    }
    if (v) fit(); else ro.disconnect();
  }
  set(mq.matches);
  mq.addEventListener('change', e => set(e.matches));
  onResize(() => on && fit());

  onScrollFrame(vh => {
    if (!on) return;
    const hh = header.offsetHeight;
    for (const s of stacks) {
      // 0 while the next section is below the screen, 1 once it has climbed to the header
      const c = clamp01(1 - (next(s).getBoundingClientRect().top - hh) / (vh - hh));
      s.style.setProperty('--cover', c.toFixed(3));
    }
  });

  // In-page links while sections stack: a covered section still sits under the header, so the browser thinks
  // a link to it needs no scroll. Aim at its place in the page instead.
  addEventListener('click', e => {
    if (!on || e.defaultPrevented || e.button || e.metaKey || e.ctrlKey || e.shiftKey) return;
    const a = e.target.closest('a[href^="#"]');
    const target = a && a.hash.length > 1 && document.getElementById(a.hash.slice(1));
    if (!target || !main.contains(target)) return;
    // the same landing as a plain anchor jump: the page's scroll padding, less the target's own scroll margin
    const y = pageTop(target) - parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) - parseFloat(getComputedStyle(target).scrollMarginTop);
    e.preventDefault();
    glideTo(Math.max(0, y)); // the same slow glide the page settles with
    history.pushState(null, '', a.hash);
  });
}
