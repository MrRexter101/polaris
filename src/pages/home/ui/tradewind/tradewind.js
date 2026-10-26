import { $, $$, clamp01, lerp, makeSpring, onResize, onScrollFrame, reduceMotion } from '../../../../shared/lib/index.js';

/* Who runs Polaris: a pinned scene. The sail runs 10%→85% of the pin; each stage lifts and lights
   over the 8% of travel before the sail reaches it (stage i at 0.10 + i·0.375), all on the shared spring. */
export function initTradewind() {
  const pin = $('[data-tw-pin]');
  if (!pin) return;
  const sticky = $('.tw-sticky', pin);
  const stages = $$('[data-tw-stage]', pin);
  let pinned = false;

  function render(p) {
    pin.style.setProperty('--tw', clamp01((p - 0.1) / 0.75).toFixed(4));
    pin.style.setProperty('--twp', p.toFixed(4));
    stages.forEach((el, i) => {
      const lit = clamp01((p - (0.1 + i * 0.375 - 0.08)) / 0.08);
      el.style.opacity = lerp(0.45, 1, lit).toFixed(3);
      el.style.transform = `translate3d(0, ${lerp(10, 0, lit).toFixed(2)}px, 0)`;
      el.style.setProperty('--lit', lit.toFixed(3));
    });
  }
  const spring = makeSpring(render);

  /* Pin only where the CSS allows it (wide screens, motion on) and the whole scene fits below its top
     offset; otherwise it scrolls as a normal section with every stage lit.
     Pin height = the scene's own height + 1.2 screens of scroll room, so it never leaves an empty screen. */
  const size = () => {
    pin.classList.remove('is-static');
    const cs = getComputedStyle(sticky);
    pinned = !reduceMotion && cs.position === 'sticky' && sticky.offsetHeight + parseFloat(cs.top) <= innerHeight;
    pin.classList.toggle('is-static', !pinned);
    pin.style.height = pinned ? `${sticky.offsetHeight + innerHeight * 1.2}px` : '';
    // the page's rest points in the scene (stack/settle.js): landed, each stage as it lights, the end
    const sec = pin.closest('section');
    if (!pinned) return sec.removeAttribute('data-stops');
    const hh = $('.site-header').offsetHeight, off = pin.getBoundingClientRect().top - sec.getBoundingClientRect().top;
    const run = pin.offsetHeight - innerHeight;
    sec.dataset.stops = [-hh, ...stages.map((_, i) => off + (0.1 + i * 0.375 + 0.01) * run), off + run].map(Math.round).join(',');
  };
  size();
  document.fonts?.ready.then(size);
  onResize(size);

  onScrollFrame(() => {
    if (!pinned) return render(1);
    const r = pin.getBoundingClientRect();
    spring.set(clamp01(-r.top / Math.max(1, r.height - innerHeight)));
  });
}
