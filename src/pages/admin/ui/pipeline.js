import { store } from '../api/store.js';
import { PACKAGE_SGD, ROUTES } from '../model/sample-data.js';
import { ago, esc, mins, sgd, shortDate } from '../lib/format.js';

/* Pipeline: every family as a card in its stage. Drag a card to another column, or open it and
   choose the stage (the keyboard way). Moves are saved through the store. */
export function renderPipeline(view, openId, toast) {
  const leads = store.leads();
  const inPlay = leads.filter(l => ['booked', 'held'].includes(l.stage)).length;
  const enrolled = leads.filter(l => l.stage === 'enrolled').length;
  view.innerHTML = `
  <header class="v-head">
    <div>
      <h1>Pipeline</h1>
      <p class="v-sentence"><b>${inPlay} consultations</b> are booked or deciding, worth ${sgd(inPlay * PACKAGE_SGD)} if they enrol. ${enrolled} families have enrolled so far.</p>
    </div>
    <label class="filter">Route
      <select data-route><option value="">All routes</option>${ROUTES.map(r => `<option value="${r.id}">Type ${r.id} · ${r.programme}</option>`).join('')}</select>
    </label>
  </header>
  <div class="board" data-board>
    ${store.stages.map(s => `
      <section class="col" data-stage="${s.id}" aria-labelledby="col-${s.id}">
        <header><h2 id="col-${s.id}">${s.name}</h2><span class="count" data-count></span><p>${s.hint}</p></header>
        <ul class="cards" data-cards></ul>
      </section>`).join('')}
  </div>
  <aside class="drawer" data-drawer hidden aria-labelledby="dr-title"></aside>`;

  const board = view.querySelector('[data-board]');
  const routeSel = view.querySelector('[data-route]');
  const fill = () => {
    const route = routeSel.value;
    store.stages.forEach(s => {
      const col = board.querySelector(`[data-stage="${s.id}"]`);
      const items = leads.filter(l => l.stage === s.id && (!route || l.route === route));
      col.querySelector('[data-count]').textContent = items.length;
      col.querySelector('[data-cards]').innerHTML = items.map(card).join('') || '<li class="col-empty">No families here</li>';
    });
  };
  const card = l => `<li class="card" data-id="${l.id}" tabindex="0" aria-label="${esc(l.family)}, ${esc(l.child)}. Open">
      <span class="c-top"><b>${esc(l.family)}</b><span class="chip r-${l.route}">Type ${l.route}</span></span>
      <span class="c-line">${esc(l.child)} · ${esc(l.grade)}</span>
      <span class="c-meta"><span>${esc(l.channel)} · ${esc(l.cc)}</span><span>${ago(l.created)}</span></span></li>`;
  fill();
  routeSel.addEventListener('change', fill);

  // ---------- drag between columns (pointer events: mouse, pen and touch) ----------
  let drag = null;
  board.addEventListener('pointerdown', e => {
    const el = e.target.closest('.card');
    if (!el || e.button > 0) return;
    drag = { el, id: el.dataset.id, x: e.clientX, y: e.clientY, moved: false, pid: e.pointerId };
  });
  board.addEventListener('pointermove', e => {
    if (!drag || e.pointerId !== drag.pid) return;
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    if (!drag.moved && Math.hypot(dx, dy) < 8) return;      // a small dead zone keeps clicks as clicks
    if (!drag.moved) { drag.moved = true; drag.el.setPointerCapture(e.pointerId); drag.el.classList.add('is-dragging'); }
    drag.el.style.transform = `translate(${dx}px, ${dy}px) rotate(${Math.max(-3, Math.min(3, dx / 40))}deg)`;
    const over = document.elementsFromPoint(e.clientX, e.clientY).find(n => n.classList?.contains('col'));
    board.querySelectorAll('.col').forEach(c => c.classList.toggle('is-over', c === over));
  });
  const end = e => {
    if (!drag) return;
    const { el, id, moved } = drag;
    drag = null;
    board.querySelectorAll('.col').forEach(c => c.classList.remove('is-over'));
    if (!moved) return open(id);
    el.classList.remove('is-dragging');
    const over = document.elementsFromPoint(e.clientX, e.clientY).find(n => n.classList?.contains('col'));
    const stage = over?.dataset.stage;
    const lead = leads.find(l => l.id === id);
    if (stage && stage !== lead.stage) {
      store.updateLead(id, { stage });
      toast(`${lead.family} moved to ${store.stages.find(s => s.id === stage).name}`);
      fill();
    } else {
      el.animate([{ transform: el.style.transform }, { transform: 'none' }], { duration: 320, easing: 'cubic-bezier(0.32, 0.72, 0, 1)' });
      el.style.transform = '';
    }
  };
  board.addEventListener('pointerup', end);
  board.addEventListener('pointercancel', () => { if (drag) { drag.el.classList.remove('is-dragging'); drag.el.style.transform = ''; drag = null; } });
  board.addEventListener('keydown', e => { const el = e.target.closest('.card'); if (el && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); open(el.dataset.id); } });

  // ---------- detail drawer ----------
  const drawer = view.querySelector('[data-drawer]');
  function open(id) {
    const l = leads.find(x => x.id === id);
    if (!l) return;
    const route = ROUTES.find(r => r.id === l.route);
    drawer.innerHTML = `
      <header><h2 id="dr-title">${esc(l.family)}</h2><button type="button" class="icon-x" data-close aria-label="Close"><svg><use href="#i-close"/></svg></button></header>
      <p class="dr-sub">${esc(l.who)} · asked ${shortDate(l.created)} (${ago(l.created)}) · <span class="sample-tag">Sample</span></p>
      <dl class="dr-facts">
        <div><dt>Student</dt><dd>${esc(l.child)}, ${esc(l.grade)}</dd></div>
        <div><dt>Curriculum</dt><dd>${esc(l.curriculum)}</dd></div>
        <div><dt>Aiming for</dt><dd>${esc(l.targets.join(', '))}</dd></div>
        <div><dt>Route</dt><dd>${esc(route.name)} (${route.programme})</dd></div>
        <div><dt>Reply on</dt><dd>${esc(l.channel)}</dd></div>
        <div><dt>From</dt><dd>${esc(l.country)} · ${esc(l.source)}</dd></div>
        <div><dt>First reply</dt><dd>${l.replyMins == null ? 'Not yet' : `after ${mins(l.replyMins)}`}</dd></div>
      </dl>
      <label class="fld">Stage<select data-stage-sel>${store.stages.map(s => `<option value="${s.id}" ${s.id === l.stage ? 'selected' : ''}>${s.name}</option>`).join('')}</select></label>
      <label class="fld">Notes<textarea rows="4" data-notes placeholder="What did the family say?">${esc(l.notes)}</textarea></label>
      <div class="dr-actions"><button type="button" class="btn btn-primary" data-save>Save</button><button type="button" class="btn btn-ghost" data-close>Close</button></div>`;
    drawer.hidden = false;
    drawer.animate([{ transform: 'translateX(24px)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 300, easing: 'cubic-bezier(0.32, 0.72, 0, 1)' });
    drawer.querySelector('select').focus();
    drawer.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', close));
    drawer.querySelector('[data-save]').addEventListener('click', () => {
      const stage = drawer.querySelector('[data-stage-sel]').value;
      const notes = drawer.querySelector('[data-notes]').value;
      const moved = stage !== l.stage;
      store.updateLead(id, { stage, notes, ...(l.replyMins == null && stage !== 'new' ? { replyMins: Math.round((Date.now() - new Date(l.created)) / 6e4) } : {}) });
      toast(moved ? `${l.family} moved to ${store.stages.find(s => s.id === stage).name}` : 'Notes saved');
      fill(); close();
    });
  }
  function close() {
    drawer.animate([{ transform: 'none', opacity: 1 }, { transform: 'translateX(24px)', opacity: 0 }], { duration: 180, easing: 'ease-in' }).onfinish = () => { drawer.hidden = true; };
  }
  view.addEventListener('keydown', e => { if (e.key === 'Escape' && !drawer.hidden) close(); });
  if (openId) open(openId);
}
