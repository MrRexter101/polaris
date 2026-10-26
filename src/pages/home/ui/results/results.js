import { $, $$, onceVisible } from '../../../../shared/lib/index.js';
import { RESULTS, SAMPLE, hasResults } from '../../model/results.js';

// text from the data is escaped, so results fed from a backend later can never inject markup
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const n = v => (Number.isFinite(+v) ? +v : 0);

// Renders model/results.js: an offers marquee, big stats and acceptance-rate bars that grow in view.
export function initResults() {
  const sec = $('[data-results]');
  const real = hasResults();
  const local = ['localhost', '127.0.0.1'].includes(location.hostname);
  if (!sec || (!real && !local)) return;
  const R = real ? RESULTS : SAMPLE;
  sec.hidden = false;
  $('[data-sample-banner]').hidden = real;

  if (R.admits.length) {
    const marquee = $('[data-res-marquee]');
    const track = $('[data-res-track]');
    const item = a => `<li><span class="res-count">${n(a.count)}+</span><span>offers from <strong>${esc(a.uni)}</strong>${a.year ? ` · ${esc(a.year)}` : ''}</span></li>`;
    track.innerHTML = [...R.admits, ...R.admits].map(item).join(''); // doubled, so the loop has no visible jump
    track.style.setProperty('--dur', `${R.admits.length * 4}s`);
    marquee.hidden = false;
    marquee.setAttribute('aria-label', R.admits.map(a => `${a.count} offers from ${a.uni}`).join(', '));
  }

  const grid = $('[data-res-grid]');
  const stat = s => `<div class="res-stat"><p class="res-big">${n(s.value)}${esc(s.suffix)}</p><p>${esc(s.label)}</p></div>`;
  const rate = r => `<div class="res-row"><span>${esc(r.uni)}</span><div class="res-bars">`
    + `<div class="res-bar"><i class="res-avg" data-w="${n(r.average)}"></i><b>${n(r.average)}%</b></div>`
    + `<div class="res-bar"><i class="res-pol" data-w="${n(r.polaris)}"></i><b>${n(r.polaris)}%</b></div></div></div>`;
  grid.innerHTML = R.stats.map(stat).join('')
    + (R.rates.length ? `<div class="res-rates"><h3>Acceptance rates</h3><p class="res-legend"><i class="res-avg"></i>Published average <i class="res-pol"></i>Polaris students</p>${R.rates.map(rate).join('')}</div>` : '');

  const max = Math.max(1, ...R.rates.flatMap(r => [r.average, r.polaris]));
  const bars = $$('.res-bar i', grid);
  if (bars.length) onceVisible(grid, () => bars.forEach((b, i) => {
    b.style.transitionDelay = `${i * 60}ms`;
    b.style.transform = `scaleX(${Math.max(0.02, Number(b.dataset.w) / max)})`;
  }));
}
