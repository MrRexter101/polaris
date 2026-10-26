import { $$ } from '../../../shared/lib/index.js';

let zones, all;
// The section showing at a height on screen. Sections overlap while one slides over another (stack.js),
// so of those crossing the line, the last in page order is the one on top.
export function sectionAt(lineY) {
  all ??= $$('main > section, .paybar, .footer');
  let top = null;
  for (const el of all) {
    if (el.hidden) continue;
    const r = el.getBoundingClientRect();
    if (r.top <= lineY && r.bottom > lineY) top = el;
  }
  return top;
}
// The dark sections. The header and the chat button switch to their light versions over these.
export function isOverNight(lineY) {
  zones ??= new Set($$('.impact-sec, .how-sec, .interlude, .campus-scene, .footer'));
  return zones.has(sectionAt(lineY));
}
