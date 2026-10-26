import { $$, onceVisible } from '../../../../shared/lib/index.js';

// <span class="odo" data-odo="880">880</span> becomes one rolling reel per digit, which rolls once in view.
export function initOdometers() {
  $$('[data-odo]').forEach(el => {
    el.replaceChildren(...el.dataset.odo.split('').map(d => {
      const col = document.createElement('span'); col.className = 'odo-col';
      const reel = document.createElement('span'); reel.className = 'odo-reel';
      reel.innerHTML = '0123456789'.split('').map(n => `<span>${n}</span>`).join('');
      reel.dataset.to = d; col.append(reel); return col;
    }));
    onceVisible(el, () => $$('.odo-reel', el).forEach((r, i) => {
      r.style.transitionDelay = `${i * 120}ms`;
      r.style.transform = `translateY(${-Number(r.dataset.to) * 10}%)`;
    }));
  });
}
