import { reduceMotion } from './dom.js';

/* A critically damped spring, the same feel as the Next.js build (Motion: stiffness 140, damping 24).
   Scroll sets the target; the value glides there with real velocity, so fast flicks never jump
   and direction changes don't snap. One rAF loop drives every spring and sleeps when all are at rest. */
const springs = new Set();
let raf = 0, last = 0;

function loop(now) {
  const dt = Math.min(0.032, (now - (last || now)) / 1000) || 0.016;
  last = now;
  for (const s of springs) {
    const force = -s.k * (s.x - s.target) - s.c * s.v;
    s.v += force * dt;
    s.x += s.v * dt;
    if (Math.abs(s.v) < 0.0005 && Math.abs(s.x - s.target) < 0.0005) { s.x = s.target; s.v = 0; springs.delete(s); }
    s.onChange(s.x);
  }
  raf = springs.size ? requestAnimationFrame(loop) : 0;
  if (!raf) last = 0;
}

export function makeSpring(onChange, { stiffness = 140, damping = 24, initial = 0 } = {}) {
  const s = { x: initial, v: 0, target: initial, k: stiffness, c: damping, onChange };
  return {
    set(t) {
      s.target = t;
      if (reduceMotion) { s.x = t; s.v = 0; onChange(t); return; }
      springs.add(s);
      if (!raf) raf = requestAnimationFrame(loop);
    },
    get: () => s.x,
  };
}
