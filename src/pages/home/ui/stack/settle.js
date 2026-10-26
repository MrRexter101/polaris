import { $ } from '../../../../shared/lib/index.js';

/* Settling (laptops and desktops, motion on). The page scrolls freely and natively, with the trackpad's own
   momentum, and nothing is skipped. When the scroll comes to rest, the page tidies up gently: if a stop is
   nearly reached in the direction you were going (within a third of a screen), it eases the rest of the way;
   if you stopped just past one, it eases back onto it; anywhere else it stays where you left it. Any new
   scroll, touch or key cancels the ease at once, so it never fights you. Stops: each section under the
   header, each film band centred, each beat inside a pinned scene (scenes list theirs in data-stops).
   Same query as stack.css. */
const QUERY = '(min-width: 1081px) and (min-height: 720px) and (prefers-reduced-motion: no-preference)';

// Where an element starts in the page. Stacked sections hold under the header, so their boxes can't say:
// add up the sections before it instead (the strip under the hero tucks up with a negative margin).
export function pageTop(el) {
  const main = $('#main');
  const sec = el.closest('#main > section');
  let y = main.getBoundingClientRect().top + scrollY;
  for (const child of main.children) {
    if (child.hidden || !child.matches('section')) continue;
    const m = getComputedStyle(child);
    y += parseFloat(m.marginTop);
    if (child === sec) break;
    y += child.getBoundingClientRect().height + parseFloat(m.marginBottom);
  }
  return sec && el !== sec ? y + el.getBoundingClientRect().top - sec.getBoundingClientRect().top : y;
}

// The glide: a slow ease in and out, about 0.7s for a short tidy-up, up to about 1.2s for a long jump.
const EASE = t => (t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2);
let gliding = false, frame = 0;
export function glideTo(to) {
  cancelAnimationFrame(frame);
  const from = scrollY, dist = to - from, far = Math.abs(dist);
  if (far < 1) return;
  const ms = 640 + 360 * Math.min(1, far / innerHeight) + Math.min(240, Math.max(0, far - innerHeight) * 0.1);
  const t0 = performance.now();
  gliding = true;
  const step = now => {
    if (!gliding) return; // cancelled
    const t = Math.min(1, (now - t0) / ms);
    scrollTo({ top: from + dist * EASE(t), behavior: 'instant' }); // instant: the page's CSS smooth scroll would fight each frame
    if (t < 1) frame = requestAnimationFrame(step);
    else gliding = false;
  };
  frame = requestAnimationFrame(step);
}
const cancelGlide = () => { gliding = false; cancelAnimationFrame(frame); };

export function initSettle() {
  const mq = matchMedia(QUERY);
  const header = $('.site-header');
  const main = $('#main');
  const on = () => mq.matches && !$('dialog[open]');

  // the scroll positions the page rests on
  function stops() {
    const hh = header.offsetHeight, vh = innerHeight, space = vh - hh;
    const max = document.documentElement.scrollHeight - vh;
    const out = [0];
    for (const el of main.children) {
      if (el.hidden || !el.matches('section') || el.matches('.hero, .log')) continue;
      const top = pageTop(el), h = el.offsetHeight;
      if (el.dataset.stops) for (const o of el.dataset.stops.split(',')) out.push(top + +o);
      else if (el.matches('.interlude')) out.push(top - hh - (space - h) / 2);
      else {
        out.push(top - hh);
        // a section taller than the screen (an open FAQ, say) gets a stop for each further screen and its foot
        for (let y = top - hh + space * 0.85; y < top + h - vh - 40; y += space * 0.85) out.push(y);
        if (h > space + 40) out.push(top + h - vh);
      }
    }
    out.push(max);
    return out.map(y => Math.round(Math.min(max, Math.max(0, y))))
      .sort((a, b) => a - b)
      .filter((y, i, a) => i === 0 || y - a[i - 1] > vh * 0.08);
  }

  // you take over at once: any scroll input stops a glide in progress
  let held = false, byKeys = false;
  addEventListener('wheel', () => { cancelGlide(); byKeys = false; }, { passive: true });
  addEventListener('touchstart', () => { cancelGlide(); byKeys = false; }, { passive: true });
  addEventListener('keydown', e => { if (/Arrow|Page|Home|End|^ $/.test(e.key)) { cancelGlide(); byKeys = true; } });
  addEventListener('mousedown', () => { cancelGlide(); held = true; }); // the scrollbar, or a text drag
  addEventListener('mouseup', () => { held = false; });

  let lastY = scrollY, dir = 0, idle = 0;
  addEventListener('scroll', () => {
    if (gliding) { lastY = scrollY; return; }
    const y = scrollY;
    if (y !== lastY) dir = Math.sign(y - lastY);
    lastY = y;
    clearTimeout(idle);
    idle = setTimeout(settle, 200); // once the scroll (and its momentum) has come to rest
  }, { passive: true });

  function settle() {
    if (!on() || gliding || held || !dir) return;
    const list = stops(), y = scrollY, vh = innerHeight;
    const ahead = dir > 0 ? list.find(s => s > y + 1) : list.findLast(s => s < y - 1);
    const behind = dir > 0 ? list.findLast(s => s <= y) : list.find(s => s >= y);
    if (ahead !== undefined && Math.abs(ahead - y) <= vh * 0.33) glideTo(ahead); // nearly there: finish it
    else if (!byKeys && behind !== undefined && Math.abs(y - behind) <= vh * 0.06) glideTo(behind); // just past one
  }
}
