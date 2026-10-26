import { $, $$, onScrollFrame } from '../../../../shared/lib/index.js';
import { waHref } from '../../../../shared/config/index.js';
import { isOverNight } from '../../lib/night.js';

/* Every WhatsApp link, the desktop chat launcher and the phone booking dock.
   Both floating controls step aside wherever a booking button is already on screen. */
export function initContactDock() {
  $$('[data-wa]').forEach(a => (a.href = waHref()));

  const chat = $('[data-chat]');
  const btn = $('[data-chat-btn]');
  const dock = $('[data-dock]');
  const setChat = open => { chat.classList.toggle('is-open', open); btn.setAttribute('aria-expanded', String(open)); };

  btn.addEventListener('click', () => setChat(!chat.classList.contains('is-open')));
  document.addEventListener('click', e => { if (!chat.contains(e.target)) setChat(false); });
  addEventListener('keydown', e => {
    if (e.key === 'Escape' && chat.classList.contains('is-open')) { setChat(false); btn.focus(); }
  });

  // hide over the hero, the campus scene, the consultation band and section, and the footer
  const covering = new Map();
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => covering.set(e.target, e.isIntersecting));
    const hide = [...covering.values()].some(Boolean);
    chat.classList.toggle('is-hidden', hide);
    dock.classList.toggle('is-hidden', hide);
    if (hide) setChat(false);
  }, { threshold: 0.12 });
  [$('.hero'), $('.campus-scene'), $('.consult-band'), $('#consult'), $('.footer')].filter(Boolean).forEach(el => io.observe(el));

  // the launcher turns white over night sections
  onScrollFrame(vh => chat.classList.toggle('on-night', isOverNight(vh - 60)));
}
