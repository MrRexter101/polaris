import { store } from '../api/store.js';
import { ROUTES } from '../model/sample-data.js';
import { requestsChart, funnelBars } from './charts.js';
import { ago, esc, mins, num, pct, sgd } from '../lib/format.js';

// Overview. Its one question: are consultation requests coming in, and who is waiting for a reply?
export function renderOverview(view, days = 30) {
  const o = store.overview(days);
  const waiting = o.waiting.length;
  const routeTotal = o.byRoute.reduce((s, r) => s + r.n, 0) || 1;
  view.innerHTML = `
  <header class="v-head">
    <div>
      <h1>Overview</h1>
      <p class="v-sentence"><b>${o.requests} ${o.requests === 1 ? 'family' : 'families'}</b> asked for a consultation in the last ${days} days. ${waiting ? `<b class="warn">${waiting} ${waiting === 1 ? 'is' : 'are'} waiting for a first reply.</b>` : 'Nobody is waiting for a reply.'}</p>
    </div>
    <div class="seg-ctl" role="group" aria-label="Time window">
      ${[7, 30, 60].map(d => `<button type="button" data-days="${d}" aria-pressed="${d === days}">${d} days</button>`).join('')}
    </div>
  </header>

  <dl class="kpis">
    <div><dt>Visitors</dt><dd>${num(o.visitors)}</dd></div>
    <div><dt>Consultation requests</dt><dd>${num(o.requests)}</dd></div>
    <div><dt>Request rate</dt><dd>${pct(o.rate, 2)}</dd><dd class="kpi-sub">of visitors</dd></div>
    <div><dt>First reply, median</dt><dd>${mins(o.medianReply)}</dd><dd class="kpi-sub">target: under 1 hour</dd></div>
    <div><dt>Enrolled from these requests</dt><dd>${num(o.enrolled)}</dd><dd class="kpi-sub">${sgd(o.revenue)} in packages</dd></div>
  </dl>

  <div class="ov-grid">
    <section class="panel ov-chart" aria-labelledby="h-req">
      <header class="p-head"><h2 id="h-req">Requests per day</h2><p class="legend"><i class="lg-bar"></i>Requests <i class="lg-area"></i>Visitors</p></header>
      ${requestsChart(o.daily)}
    </section>

    <section class="panel ov-waiting" aria-labelledby="h-wait">
      <header class="p-head"><h2 id="h-wait">Waiting for a reply</h2><a href="#pipeline" class="p-link">Pipeline →</a></header>
      ${waiting ? `<ul class="wait-list">${o.waiting.map((l, i) => `
        <li><span class="avatar" style="--h:${(l.family.charCodeAt(0) * 47) % 360}">${esc(l.family[0])}</span>
          <span class="w-main"><b>${esc(l.family)}</b><span>${esc(l.child)} · ${esc(l.grade)} · ${esc(l.channel)}</span></span>
          <span class="w-age ${new Date() - new Date(l.created) > 36e5 ? 'late' : ''}">${ago(l.created)}</span>
          <a class="btn ${i === 0 ? 'btn-primary' : 'btn-ghost'} btn-sm" href="#pipeline/${l.id}">Reply</a></li>`).join('')}</ul>`
        : '<p class="empty">Everyone has had a reply.</p>'}
    </section>

    <section class="panel ov-funnel" aria-labelledby="h-fun">
      <header class="p-head"><h2 id="h-fun">From visit to enrolment</h2><p class="p-note">last ${days} days · % of the step before</p></header>
      ${funnelBars(o.steps)}
    </section>

    <section class="panel ov-mix" aria-labelledby="h-mix">
      <header class="p-head"><h2 id="h-mix">Which route families chose</h2></header>
      <div class="route-bar" role="img" aria-label="${o.byRoute.map(r => `Type ${r.id}: ${r.n}`).join(', ')}">
        ${o.byRoute.map(r => `<i class="r-${r.id}" style="flex:${r.n || 0.0001}"></i>`).join('')}
      </div>
      <ul class="route-list">${o.byRoute.map(r => { const meta = ROUTES.find(x => x.id === r.id); return `<li><i class="dot r-${r.id}"></i><span>${meta.name}<small>${meta.programme}</small></span><b>${r.n}</b><em>${Math.round(r.n / routeTotal * 100)}%</em></li>`; }).join('')}</ul>
      <div class="two-lists">
        <div><h3>Where they're from</h3><ul class="rank">${o.byCountry.slice(0, 5).map(c => `<li><span>${esc(c.name)}</span><b>${c.n}</b></li>`).join('') || '<li class="empty">–</li>'}</ul></div>
        <div><h3>How they found us</h3><ul class="rank">${o.bySource.slice(0, 5).map(c => `<li><span>${esc(c.name)}</span><b>${c.n}</b></li>`).join('') || '<li class="empty">–</li>'}</ul></div>
      </div>
    </section>
  </div>`;
  view.querySelectorAll('[data-days]').forEach(b => b.addEventListener('click', () => renderOverview(view, +b.dataset.days)));
}
