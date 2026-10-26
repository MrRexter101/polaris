import { num, shortDate } from '../lib/format.js';

/* Small SVG charts in the admin's one data hue (violet). Visitors are a quiet grey area behind;
   requests, the thing the screen is about, are the violet bars. */
export function requestsChart(daily) {
  const W = 720, H = 220, pad = { l: 34, r: 8, t: 12, b: 26 };
  const iw = W - pad.l - pad.r, ih = H - pad.t - pad.b;
  const maxV = Math.max(...daily.map(d => d.visitors)), maxR = Math.max(3, ...daily.map(d => d.requests));
  const x = i => pad.l + (i + 0.5) * (iw / daily.length);
  const yV = v => pad.t + ih - (v / maxV) * ih;
  const yR = v => pad.t + ih - (v / maxR) * ih;
  const bw = Math.max(3, iw / daily.length - 4);
  const area = `M${x(0)} ${pad.t + ih} ` + daily.map((d, i) => `L${x(i)} ${yV(d.visitors)}`).join(' ') + ` L${x(daily.length - 1)} ${pad.t + ih} Z`;
  const ticks = [0, Math.ceil(maxR / 2), maxR];
  const labels = daily.map((d, i) => (i % 7 === daily.length % 7 ? `<text x="${x(i)}" y="${H - 6}" text-anchor="middle">${shortDate(d.date)}</text>` : '')).join('');
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Consultation requests per day, with visitors behind">
    ${ticks.map(t => `<line class="grid" x1="${pad.l}" x2="${W - pad.r}" y1="${yR(t)}" y2="${yR(t)}"/><text class="axis" x="${pad.l - 8}" y="${yR(t) + 4}" text-anchor="end">${t}</text>`).join('')}
    <path class="area" d="${area}"/>
    ${daily.map((d, i) => d.requests ? `<rect class="bar" x="${x(i) - bw / 2}" y="${yR(d.requests)}" width="${bw}" height="${pad.t + ih - yR(d.requests)}" rx="2"><title>${shortDate(d.date)}: ${d.requests} request${d.requests > 1 ? 's' : ''}, ${num(d.visitors)} visitors</title></rect>` : '').join('')}
    <g class="axis">${labels}</g>
  </svg>`;
}

// Funnel as horizontal bars: each step's share of visitors, the count at the end.
export function funnelBars(steps) {
  const top = steps[0].n || 1;
  return `<ol class="funnel">${steps.map((s, i) => {
    const share = s.n / top;
    const conv = i ? (steps[i - 1].n ? s.n / steps[i - 1].n : 0) : 1;
    return `<li><span class="f-name">${s.name}</span><span class="f-bar"><i style="--w:${Math.max(0.004, share)}"></i></span><span class="f-n">${num(s.n)}</span><span class="f-conv">${i ? `${(conv * 100).toFixed(conv < 0.1 ? 1 : 0)}%` : ''}</span></li>`;
  }).join('')}</ol>`;
}
