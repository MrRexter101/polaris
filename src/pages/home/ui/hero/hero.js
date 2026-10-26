import { $, clamp01, makeSpring, onScrollFrame, reduceMotion, watchFilm } from '../../../../shared/lib/index.js';

// The hero film autoplays (never with reduced motion) and has a pause/play button.
export function initHero() {
  const film = $('.hero-video');
  const toggle = $('[data-film-toggle]');
  let pausedByUser = reduceMotion;

  const setPlaying = play => {
    if (play) film.play().catch(() => {}); else film.pause();
    toggle.setAttribute('aria-label', play ? 'Pause background film' : 'Play background film');
    $('use', toggle).setAttribute('href', play ? '#pause' : '#play');
  };
  if (reduceMotion) film.removeAttribute('autoplay');
  setPlaying(!reduceMotion);
  toggle.addEventListener('click', () => { pausedByUser = !film.paused; setPlaying(film.paused); });
  watchFilm(film, () => !pausedByUser);

  // as the page scrolls on, the film frame settles back and the copy lifts away (--away 0→1)
  if (reduceMotion) return;
  const hero = $('.hero');
  const frame = $('.hero-frame');
  const away = makeSpring(v => hero.style.setProperty('--away', v.toFixed(4)));
  onScrollFrame(() => {
    if (scrollY > frame.offsetHeight * 1.5) return;
    away.set(clamp01(scrollY / frame.offsetHeight));
  });
}
