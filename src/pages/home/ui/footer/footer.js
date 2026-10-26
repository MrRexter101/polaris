import { $, clamp01, onScrollFrame, reduceMotion } from '../../../../shared/lib/index.js';

/* The footer: the POLARIS wordmark rises as the page ends, and the small star in the coordinates line
   is the private way into the admin page: three quick presses, or one long press on a phone.
   This only hides the door; the admin page's login is what protects it. */
export function initFooter() {
  const footer = $('.footer');
  if (!reduceMotion) onScrollFrame(vh => {
    const r = footer.getBoundingClientRect();
    if (r.top > vh) return;
    footer.style.setProperty('--rise', clamp01((vh - r.top) / r.height).toFixed(3));
  });

  const door = $('[data-admin-door]');
  if (!door) return;
  const go = () => { location.href = 'admin/'; };
  let presses = 0, timer = 0, hold = 0;
  door.addEventListener('click', () => {
    presses += 1;
    clearTimeout(timer);
    if (presses >= 3) { presses = 0; go(); return; }
    timer = setTimeout(() => { presses = 0; }, 700);
  });
  door.addEventListener('pointerdown', e => { if (e.pointerType === 'touch') hold = setTimeout(go, 800); });
  ['pointerup', 'pointercancel', 'pointerleave'].forEach(ev => door.addEventListener(ev, () => clearTimeout(hold)));
}
