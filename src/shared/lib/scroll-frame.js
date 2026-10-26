/* One scroll loop for the whole page. Every scroll-linked effect registers here, so all of them
   read layout and write styles in the same animation frame instead of each listening on its own. */
const frameFns = [];
const resizeFns = [];
let queued = false;

function frame() {
  queued = false;
  const vh = innerHeight;
  for (const fn of frameFns) fn(vh);
}
function queue() {
  if (queued) return;
  queued = true;
  requestAnimationFrame(frame);
}

// fn(viewportHeight) runs once per frame while the page scrolls, and after each resize.
export function onScrollFrame(fn) {
  frameFns.push(fn);
  queue();
}
// fn() runs once the window has stopped resizing (120ms), before the next scroll frame.
export function onResize(fn) {
  resizeFns.push(fn);
}

addEventListener('scroll', queue, { passive: true });
let timer;
addEventListener('resize', () => {
  clearTimeout(timer);
  timer = setTimeout(() => { resizeFns.forEach(fn => fn()); queue(); }, 120);
});
