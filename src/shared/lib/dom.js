// Small DOM and maths helpers used everywhere.
export const $ = (s, el = document) => el.querySelector(s);
export const $$ = (s, el = document) => [...el.querySelectorAll(s)];
export const clamp01 = v => Math.min(1, Math.max(0, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
