import { $, onceVisible } from '../../../../shared/lib/index.js';

// The sample Pathway Map's bars draw in once, when the map is well in view.
export function initPathwayMap() {
  const map = $('.map');
  onceVisible(map, () => map.classList.add('is-in'), { threshold: 0.4 });
}
