import { $$, reduceMotion } from '../../lib/dom.js';

const EASE = 'cubic-bezier(0.16, 1, 0.3, 1)';
const KINDS = {
  // headings rise from behind their own baseline
  mask: el => el.animate(
    [{ clipPath: 'inset(0 0 calc(100% - 1px) 0)', translate: '0 .3em' }, { clipPath: 'inset(-20% -4% -20% -4%)', translate: '0 0' }],
    { duration: 900, easing: EASE, fill: 'backwards' }),
  // everything else lifts a short way while it fades in: no blur, no zoom, nothing that reads as a smear
  rise: el => el.animate(
    [{ opacity: 0, translate: '0 18px' }, { opacity: 1, translate: '0 0' }],
    { duration: 800, easing: EASE, fill: 'backwards' }),
};

/* Which elements enter, and how. Groups of siblings stagger by 75ms each (up to 6).
   Nothing in the hero, the pinned scenes, the Tradewind stages or anything marked data-own-motion
   (those have their own motion; an entrance on top would fight it and flash). */
const RULES = [
  ['mask', '.section h2'],
  ['rise', '.section .body-lg, .how-head > p, .how-head > .btn, .tw-note, .lead, .directors, .placeholder-note, .section .link-arrow'],
  ['rise', '.track, .cover-row, .mentor, .tutor, .step, .harbour, .folder, .quote, .faq details, .res-stat, .res-rates, .price-card, .map, .form, .tw-partners'],
  ['rise', '.video-sec .video, .impact-photo'],
];
const SKIP = '.hero, [data-tw-stage], .campus-scene, [data-own-motion]';

export function initReveal() {
  if (reduceMotion || !('IntersectionObserver' in window) || !Element.prototype.animate) return;
  const items = [];
  for (const [kind, sel] of RULES) {
    for (const el of $$(sel)) {
      if (el.closest(SKIP) || el.dataset.reveal) continue;
      el.dataset.reveal = kind;
      items.push(el);
    }
  }
  // stagger: position among siblings that also reveal
  for (const el of items) {
    const sibs = [...el.parentElement.children].filter(c => c.dataset.reveal);
    el._delay = Math.min(6, Math.max(0, sibs.indexOf(el))) * 75;
  }
  document.documentElement.classList.add('reveal-on');

  const io = new IntersectionObserver(entries => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      const el = e.target;
      io.unobserve(el);
      setTimeout(() => {
        el.classList.add('is-revealed');
        KINDS[el.dataset.reveal](el);
      }, el._delay);
    }
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0 });
  items.forEach(el => io.observe(el));
}
