import { $, $$, onResize, onScrollFrame, reduceMotion } from '../../../../shared/lib/index.js';
import { isOverNight, sectionAt } from '../../lib/night.js';

export function initHeader() {
  const header = $('[data-header]');
  const bar = $('.progress span');

  // paper or night header, and the reading-progress line
  onScrollFrame(vh => {
    const y = scrollY;
    const max = document.documentElement.scrollHeight - vh;
    header.classList.toggle('is-scrolled', y > 8);
    header.classList.toggle('is-night', isOverNight(header.offsetHeight + 1)); // the section just under the header
    bar.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
  });

  // one amber bar slides under the link of the section in the middle of the screen
  const links = $$('.nav a');
  const ink = $('.nav-ink');
  let active = null;
  const placeInk = () => {
    if (!ink) return;
    ink.style.setProperty('--o', active ? '1' : '0');
    if (!active) return;
    ink.style.setProperty('--x', `${active.offsetLeft + 14}px`);
    ink.style.setProperty('--w', ((active.offsetWidth - 28) / 100).toFixed(3)); // the bar is 100px wide at scale 1
  };
  // the section in the middle of the screen, or the nearest one above it that has a link (Impact counts as
  // Package, the campus scene as Package, Results and Families as Tradewind); none above the first: no bar
  const sections = $$('main > section');
  const linkFor = el => el.id && links.find(a => a.getAttribute('href') === `#${el.id}`);
  onScrollFrame(vh => {
    const sec = sectionAt(vh / 2);
    let i = sec ? sections.indexOf(sec) : -1;
    if (sec && i < 0) i = sections.length - 1; // the payments line and the footer follow the last section
    let link = null;
    for (; i >= 0 && !link; i--) link = linkFor(sections[i]);
    if (link === active) return;
    active = link;
    links.forEach(a => a.classList.toggle('is-active', a === active));
    placeInk();
  });
  onResize(placeInk);
  document.fonts?.ready.then(placeInk);

  // mobile menu
  const btn = $('[data-menu-btn]');
  const menu = $('[data-menu]');
  const setMenu = open => {
    btn.setAttribute('aria-expanded', String(open));
    if (open) { menu.classList.remove('is-closing'); menu.hidden = false; return; }
    if (menu.hidden || reduceMotion) { menu.hidden = true; return; }
    menu.classList.add('is-closing');
    menu.addEventListener('animationend', () => { menu.hidden = true; menu.classList.remove('is-closing'); }, { once: true });
  };
  btn.addEventListener('click', () => setMenu(menu.hidden));
  menu.addEventListener('click', e => { if (e.target.closest('a')) setMenu(false); });
  addEventListener('keydown', e => {
    if (e.key === 'Escape' && !menu.hidden) { setMenu(false); btn.focus(); }
  });
}
