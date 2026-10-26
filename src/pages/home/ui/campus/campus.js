import { $, $$, clamp01, makeSpring, onResize, onScrollFrame, reduceMotion } from '../../../../shared/lib/index.js';
import { createScrubber } from '../../../../shared/lib/scrub-video.js';

/* The campus scene: while it is pinned, the scroll plays one film from the reading room to Oxford,
   Cambridge, Stanford and the Ivy League (campus-reel.mp4, rendered in polaris-studio). Each name
   in the sentence lights as its campus arrives; data-at holds where in the film (0–1) that happens. */
export function initCampus() {
  const scene = $('[data-campus]');
  if (!scene) return;
  const video = $('[data-campus-film]', scene);
  const names = $$('.campus-line b', scene);
  const places = $$('.campus-places li', scene);
  const at = el => parseFloat(el.dataset.at);

  if (reduceMotion) { names.forEach(b => b.classList.add('is-lit')); return; }

  // fetch the film only when the scene is within a screen or two
  const near = new IntersectionObserver(([e]) => {
    if (!e.isIntersecting) return;
    near.disconnect();
    video.preload = 'auto';
    video.load();
  }, { rootMargin: '150% 0px' });
  near.observe(scene);

  const seek = createScrubber(video);
  let current = -1;
  const render = p => {
    scene.style.setProperty('--p', p.toFixed(4));
    seek(p);
    names.forEach(b => b.classList.toggle('is-lit', p >= at(b) - 0.02));
    const idx = places.reduce((n, li, i) => (p >= at(li) - 0.02 ? i : n), 0);
    if (idx !== current) { current = idx; places.forEach((li, i) => li.classList.toggle('is-current', i === idx)); }
  };
  // the page's rest points in the scene (stack/settle.js): landed, each campus as its name lights, the end
  const publishStops = () => {
    const hh = $('.site-header').offsetHeight, run = scene.offsetHeight - innerHeight;
    scene.dataset.stops = [-hh, ...names.map(b => (at(b) + 0.012) * run), run].map(Math.round).join(',');
  };
  publishStops();
  onResize(publishStops);
  const progress = makeSpring(render, { stiffness: 120, damping: 22 });
  const open = makeSpring(v => scene.style.setProperty('--open', v.toFixed(4)));
  render(0);

  onScrollFrame(vh => {
    const r = scene.getBoundingClientRect();
    if (r.bottom < -vh || r.top > vh * 2) return;
    open.set(clamp01((vh - r.top) / (vh * 0.7)));
    progress.set(clamp01(-r.top / Math.max(1, r.height - vh)));
  });
}
