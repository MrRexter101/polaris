import { $$ } from '../../../../shared/lib/index.js';

// "Which type of student are you?": one track open at a time. The open track's column widens (--cols)
// and its details slide open; on phones the tracks stack and open like an accordion.
export function initChooser() {
  const grid = document.querySelector('[data-routes]');
  if (!grid) return;
  const tracks = $$('[data-route-card]', grid);
  const COLS = ['2fr 1fr 1fr', '1fr 2fr 1fr', '1fr 1fr 2fr'];
  const open = i => {
    tracks.forEach((t, j) => {
      t.classList.toggle('is-active', i === j);
      t.querySelector('.track-face').setAttribute('aria-expanded', String(i === j));
    });
    grid.style.setProperty('--cols', COLS[i]);
  };
  tracks.forEach((t, i) => t.querySelector('.track-face').addEventListener('click', () => open(i)));
}
