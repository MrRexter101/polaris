import { $, $$, onResize, reduceMotion } from '../../../../shared/lib/index.js';

// Tutor carousel: arrows step one card; each arrow disables at its end.
export function initTutors() {
  const track = $('[data-track]');
  const [prev, next] = $$('[data-scroll]');
  const step = () => ($('.tutor', track)?.offsetWidth ?? 280) + 20;
  [prev, next].forEach(b => b.addEventListener('click', () =>
    track.scrollBy({ left: Number(b.dataset.scroll) * step(), behavior: reduceMotion ? 'auto' : 'smooth' })));

  const sync = () => {
    prev.disabled = track.scrollLeft < 4;
    next.disabled = track.scrollLeft + track.clientWidth >= track.scrollWidth - 4;
  };
  track.addEventListener('scroll', sync, { passive: true });
  onResize(sync);
  sync();
}
