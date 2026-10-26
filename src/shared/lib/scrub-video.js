import { clamp01 } from './dom.js';

/* Turns a <video> into something the scroll can play: seek(t) shows position t (0–1).
   One seek at a time and the newest wins, so fast scrolling never queues a backlog in the decoder.
   The file needs short keyframe gaps (ours use one every 6 frames) to seek smoothly. */
export function createScrubber(video) {
  let seeking = false, pending = null, last = 0;
  const seek = t => {
    last = clamp01(t);
    if (!video.duration) return;
    const want = last * (video.duration - 0.05);
    if (seeking) { pending = want; return; }
    seeking = true;
    try { video.currentTime = want; } catch { seeking = false; }
  };
  video.addEventListener('seeked', () => {
    seeking = false;
    if (pending !== null) { const n = pending; pending = null; seeking = true; video.currentTime = n; }
  });
  video.addEventListener('loadedmetadata', () => seek(last));
  // iOS won't paint a seeked frame on a video that has never played: prime it on the first touch
  ['touchstart', 'pointerdown', 'wheel', 'keydown'].forEach(ev => addEventListener(ev, () => {
    video.play().then(() => video.pause()).catch(() => {});
  }, { once: true, passive: true }));
  return seek;
}
