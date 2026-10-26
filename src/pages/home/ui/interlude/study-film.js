import { $, clamp01, makeSpring, onScrollFrame, reduceMotion } from '../../../../shared/lib/index.js';
import { createScrubber } from '../../../../shared/lib/scrub-video.js';

// Study film: the scroll plays the clip, so the pen moves as you scroll.
export function initStudyFilm() {
  const stage = $('[data-study]');
  const video = $('[data-scrub]');
  if (!stage || !video) return;
  const frame = stage.parentElement;
  // fetch the film only when it is within a screen or two
  const near = new IntersectionObserver(([e]) => {
    if (!e.isIntersecting) return;
    near.disconnect();
    video.preload = 'auto';
    video.load();
  }, { rootMargin: '150% 0px' });
  near.observe(frame);
  const seek = createScrubber(video);
  const spring = makeSpring(v => { seek(v); stage.style.setProperty('--push', v.toFixed(4)); }, { stiffness: 120, damping: 22 });

  onScrollFrame(vh => {
    const r = frame.getBoundingClientRect();
    frame.style.setProperty('--frame-h', `${r.height}px`);
    if (reduceMotion || r.bottom < 0 || r.top > vh) return;
    spring.set(clamp01((vh - r.top) / (vh + r.height))); // the whole pass through the viewport
  });
}
