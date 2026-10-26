import { $$ } from '../../lib/dom.js';
import { onceVisible } from '../../lib/visibility.js';

// Each chapter marker draws in once as its section arrives (see chapter.css).
export function initChapters() {
  $$('.chapter').forEach(m => onceVisible(m, () => m.classList.add('is-in'), { rootMargin: '0px 0px -10% 0px' }));
}
