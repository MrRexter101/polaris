import { $$, clamp01, makeSpring, onScrollFrame, reduceMotion, watchFilm } from '../../../../shared/lib/index.js';

// Film bands open from an inset frame to full width as they rise into view,
// and the footage drifts slightly slower than the page for depth.
export function initInterludes() {
  const bands = $$('[data-expand]').map(el => ({
    el,
    open: makeSpring(v => { el.style.setProperty('--open', v.toFixed(4)); el.classList.toggle('is-open', v > 0.6); }),
    drift: makeSpring(v => el.style.setProperty('--drift', v.toFixed(4)), { stiffness: 90, damping: 20 }),
  }));
  $$('[data-expand] video[data-film]').forEach(v => watchFilm(v));
  if (reduceMotion) return;

  onScrollFrame(vh => {
    for (const b of bands) {
      const r = b.el.getBoundingClientRect();
      if (r.bottom < -200 || r.top > vh + 200) continue;
      b.open.set(clamp01((vh - r.top) / (vh * 0.6)));
      b.drift.set((r.top + r.height / 2 - vh / 2) / vh);
    }
  });
}
