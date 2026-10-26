import { $, $$, clamp01, fitSticky, makeSpring, onResize, onScrollFrame, watchFilm } from '../../../../shared/lib/index.js';

/* How it works: an amber course is drawn through each step's star as you scroll,
   and a sail rides its tip, tilting as the course tacks left and right. */
export function initVoyage() {
  watchFilm($('.how-film'));
  fitSticky($('.how-head'), 48);

  const voyage = $('[data-voyage]');
  const course = $('[data-course]');
  const line = $('[data-line]');
  const wake = $('[data-wake]');
  const boat = $('[data-vboat]');
  const stops = $$('[data-step]', voyage);
  let waypointsY = [], pathLen = 0, shown = 0, boatW = 46;

  function build() {
    const lane = parseFloat(getComputedStyle(voyage).getPropertyValue('--lane')) || 72;
    const cx = lane / 2, swing = lane * 0.26, h = voyage.offsetHeight;
    course.setAttribute('viewBox', `0 0 ${lane} ${h}`);
    course.style.height = `${h}px`;

    // waypoint centres: each step's star, then the harbour light
    // (read from CSS, not measured: an SVG has no offsetTop, and the steps may still be mid-entrance)
    waypointsY = stops.map(el => {
      if (el.classList.contains('harbour')) { // just above the harbour light
        const light = getComputedStyle($('.harbour-light', el));
        return el.offsetTop + el.offsetHeight - parseFloat(light.bottom) - parseFloat(light.height) - 4;
      }
      const star = getComputedStyle($('.waypoint', el));
      return el.offsetTop + parseFloat(star.top) + parseFloat(star.height) / 2;
    });

    // the course passes through every waypoint and tacks between them
    // it starts with a short straight run into the first star
    let y0 = Math.max(0, waypointsY[0] - 26), d = `M${cx} ${y0}`;
    waypointsY.forEach((y1, i) => {
      const s = i % 2 ? swing : -swing, dy = y1 - y0;
      d += i ? ` C${cx + s} ${y0 + dy * 0.33} ${cx + s} ${y0 + dy * 0.67} ${cx} ${y1}` : ` L${cx} ${y1}`;
      y0 = y1;
    });
    line.setAttribute('d', d);
    wake.setAttribute('d', d);
    boatW = parseFloat(getComputedStyle(boat).width) || 46;
    pathLen = line.getTotalLength();
    line.style.strokeDasharray = `${pathLen} ${pathLen}`;
    render(shown);
  }

  function render(p) {
    if (!pathLen) return;
    const len = p * pathLen;
    line.style.strokeDashoffset = String(pathLen - len);
    const pt = line.getPointAtLength(len);
    const ahead = line.getPointAtLength(Math.min(pathLen, len + 6));
    const tilt = Math.max(-14, Math.min(14, (ahead.x - pt.x) * 6));
    boat.style.transform = `translate3d(${pt.x - boatW / 2}px, ${pt.y - boatW * 0.82}px, 0) rotate(${tilt}deg)`;
    boat.style.opacity = String(clamp01((1 - p) / 0.05)); // the sail fades into harbour as the light comes on
    stops.forEach((el, i) => el.classList.toggle('is-passed', pt.y >= waypointsY[i] - 2));
  }

  const spring = makeSpring(v => { shown = v; render(v); });
  build();
  document.fonts?.ready.then(build);
  addEventListener('load', build);
  onResize(build);
  // pinned (the scene query in how-it-works.css): scrolling through the section sails the course, finishing a little
  // before the stage lets go. Fitted to one screen without motion (base.css .screen): sailed as the section lands.
  // Otherwise the course follows the steps past the middle of the screen.
  const scene = matchMedia('(min-width: 1081px) and (min-height: 720px) and (prefers-reduced-motion: no-preference)');
  const fitted = matchMedia('(min-width: 1081px) and (min-height: 720px)');
  const sec = voyage.closest('section'), header = $('.site-header');
  voyage.toggleAttribute('data-own-motion', scene.matches); // the steps light with the sail, not with an entrance
  // the page's rest points in the scene (stack/settle.js): landed, then each step as the sail reaches it
  const publishStops = () => {
    if (!scene.matches || !waypointsY.length) return sec.removeAttribute('data-stops');
    const hh = header.offsetHeight, run = 0.85 * (sec.offsetHeight - (innerHeight - hh));
    const first = waypointsY[0] - 26, span = waypointsY.at(-1) - first;
    sec.dataset.stops = [-hh, ...waypointsY.map(y => -hh + Math.min(1, (y - first) / span + 0.02) * run)].map(Math.round).join(',');
  };
  publishStops();
  onResize(publishStops);
  document.fonts?.ready.then(publishStops);
  onScrollFrame(vh => {
    const r = voyage.getBoundingClientRect(), hh = header.offsetHeight, top = sec.getBoundingClientRect().top;
    if (scene.matches) spring.set(clamp01((hh - top) / (0.85 * Math.max(1, sec.offsetHeight - (vh - hh)))));
    else if (fitted.matches) spring.set(clamp01((vh - r.top) / Math.max(1, vh - hh - (r.top - top))));
    else spring.set(clamp01((vh * 0.62 - r.top) / r.height));
  });
}
