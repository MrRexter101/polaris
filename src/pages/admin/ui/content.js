import { store } from '../api/store.js';
import { esc } from '../lib/format.js';

/* Content: what the homepage shows. In sample mode edits stay in this browser; with the backend
   connected, the site reads them at load, so a change here goes live without touching code. */
const TABS = [['sections', 'Sections'], ['hero', 'Hero text'], ['images', 'Images'], ['results', 'Results'], ['testimonials', 'Testimonials']];

export function renderContent(view, tab = 'sections', toast) {
  view.innerHTML = `
  <header class="v-head">
    <div><h1>Content</h1><p class="v-sentence">Change what the homepage shows. <span class="muted">In sample mode, changes are kept in this browser and don't reach the live site.</span></p></div>
  </header>
  <nav class="tabs" aria-label="Content">${TABS.map(([id, name]) => `<a href="#content/${id}" aria-current="${id === tab ? 'page' : 'false'}">${name}</a>`).join('')}</nav>
  <div class="tab-body" data-body></div>`;
  const body = view.querySelector('[data-body]');
  ({ sections, hero, images, results, testimonials })[tab]?.(body, toast);
}

function sections(body, toast) {
  const list = store.sections();
  const draw = () => {
    body.innerHTML = `<ol class="sec-list">${list.map((s, i) => `
      <li class="${s.visible ? '' : 'is-off'}">
        <span class="sec-n">${i + 1}</span><span class="sec-name">${esc(s.name)}</span>
        <span class="sec-move"><button type="button" data-up="${i}" aria-label="Move ${esc(s.name)} up" ${i ? '' : 'disabled'}>↑</button><button type="button" data-down="${i}" aria-label="Move ${esc(s.name)} down" ${i < list.length - 1 ? '' : 'disabled'}>↓</button></span>
        <label class="switch"><input type="checkbox" data-vis="${i}" ${s.visible ? 'checked' : ''}><span></span><em>${s.visible ? 'Shown' : 'Hidden'}</em></label>
      </li>`).join('')}</ol>
      <p class="hint">Results stays hidden until it has real numbers with a source. Hiding a section removes it from the page and the menu.</p>`;
  };
  draw();
  body.addEventListener('click', e => {
    const up = e.target.closest('[data-up]'), down = e.target.closest('[data-down]');
    const i = +(up?.dataset.up ?? down?.dataset.down ?? -1);
    if (i < 0) return;
    const j = up ? i - 1 : i + 1;
    [list[i], list[j]] = [list[j], list[i]];
    store.saveSections(list); draw();
    body.querySelector(up ? `[data-up="${j}"]` : `[data-down="${j}"]`)?.focus();
  });
  body.addEventListener('change', e => {
    const v = e.target.closest('[data-vis]');
    if (!v) return;
    list[+v.dataset.vis].visible = v.checked;
    store.saveSections(list); draw();
    toast(`${list[+v.dataset.vis].name} ${v.checked ? 'shown' : 'hidden'}`);
  });
}

function hero(body, toast) {
  const h = store.hero();
  body.innerHTML = `
    <form class="form-grid" data-hero>
      <label class="fld">Headline <small>Two short sentences read best. ${'<span data-len></span>'}</small><input name="headline" value="${esc(h.headline)}" maxlength="90"></label>
      <label class="fld">Supporting line<textarea name="lede" rows="3" maxlength="240">${esc(h.lede)}</textarea></label>
      <div class="preview" aria-label="Preview"><p class="pv-h" data-pv-h></p><p class="pv-l" data-pv-l></p></div>
      <div class="dr-actions"><button class="btn btn-primary" type="submit">Save hero text</button></div>
    </form>`;
  const f = body.querySelector('form');
  const sync = () => { body.querySelector('[data-pv-h]').textContent = f.headline.value; body.querySelector('[data-pv-l]').textContent = f.lede.value; body.querySelector('[data-len]').textContent = `${f.headline.value.length}/90`; };
  f.addEventListener('input', sync); sync();
  f.addEventListener('submit', e => { e.preventDefault(); store.saveHero({ headline: f.headline.value.trim(), lede: f.lede.value.trim() }); toast('Hero text saved'); });
}

const SITE_IMAGES = [
  ['../assets/video/campus-hero-poster.webp', 'Hero film, first frame'], ['../assets/campus/radcliffe.webp', 'Type I · Radcliffe Camera'],
  ['../assets/campus/sather-tower.webp', 'Type II · Sather Tower'], ['../assets/campus/columbia.webp', 'Type III · Columbia'],
  ['../assets/ian.webp', 'Ian Caddy'], ['../assets/maxime.webp', 'Dr. Maxime Herve'], ['../assets/lotus.webp', 'Lotus S. Kim'], ['../assets/francis.webp', 'Prof. Francis Kim'],
];
function images(body, toast) {
  const draw = () => {
    const added = store.images();
    body.innerHTML = `
      <label class="drop" data-drop><input type="file" accept="image/*" multiple data-file hidden><b>Add images</b><span>Drop files here or choose them. JPG, PNG or WebP, up to 5 MB each.</span></label>
      <ul class="img-grid">
        ${added.map(i => `<li><img src="${esc(i.src)}" alt=""><span>${esc(i.name)}<em>Added ${new Date(i.at).toLocaleDateString('en-SG')}</em></span></li>`).join('')}
        ${SITE_IMAGES.map(([src, name]) => `<li><img src="${src}" alt="" loading="lazy"><span>${esc(name)}<em>On the site</em></span></li>`).join('')}
      </ul>`;
    const drop = body.querySelector('[data-drop]'), input = body.querySelector('[data-file]');
    const take = files => [...files].filter(f => f.type.startsWith('image/')).forEach(f => {
      if (f.size > 5e6) return toast(`${f.name} is over 5 MB`);
      const r = new FileReader();
      r.onload = () => { store.addImage({ src: r.result, name: f.name, at: Date.now() }); toast(`${f.name} added`); draw(); };
      r.readAsDataURL(f);
    });
    input.addEventListener('change', () => take(input.files));
    ['dragenter', 'dragover'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.add('is-over'); }));
    ['dragleave', 'drop'].forEach(ev => drop.addEventListener(ev, e => { e.preventDefault(); drop.classList.remove('is-over'); }));
    drop.addEventListener('drop', e => take(e.dataTransfer.files));
  };
  draw();
}

// Results: every row needs a source, so nothing unverified can reach the page.
function results(body, toast) {
  const rows = store.results();
  const draw = () => {
    body.innerHTML = `
      <p class="hint">Add real offers only. Each row needs a link or document that proves it; rows without a source stay off the site.</p>
      <table class="tbl"><thead><tr><th>University</th><th class="num">Offers</th><th>Year</th><th>Source</th><th></th></tr></thead>
      <tbody>${rows.map((r, i) => `<tr><td>${esc(r.uni)}</td><td class="num">${r.count}</td><td>${esc(r.year)}</td><td>${/^https:\/\//i.test(r.source ?? '') ? `<a href="${esc(r.source)}" target="_blank" rel="noopener noreferrer">Source ↗</a>` : '<span class="warn">Missing</span>'}</td><td><button type="button" class="btn-text" data-del="${i}">Remove</button></td></tr>`).join('') || '<tr><td colspan="5" class="empty">No results yet. The Results section stays hidden until the first one is added.</td></tr>'}</tbody></table>
      <form class="row-form" data-add>
        <label class="fld">University<input name="uni" required placeholder="University of Oxford"></label>
        <label class="fld">Offers<input name="count" type="number" min="1" required></label>
        <label class="fld">Year<input name="year" required placeholder="2026" inputmode="numeric"></label>
        <label class="fld">Source link<input name="source" type="url" required placeholder="https://" pattern="https://.+"></label>
        <button class="btn btn-dark" type="submit">Add result</button>
      </form>`;
    body.querySelector('[data-add]').addEventListener('submit', e => {
      e.preventDefault();
      const f = e.target;
      const source = f.source.value.trim();
      if (!/^https:\/\//i.test(source)) { toast('The source must be a link starting with https://'); f.source.focus(); return; }
      rows.push({ uni: f.uni.value.trim(), count: +f.count.value, year: f.year.value.trim(), source });
      store.saveResults(rows); toast('Result added'); draw();
    });
    body.querySelectorAll('[data-del]').forEach(b => b.addEventListener('click', () => { rows.splice(+b.dataset.del, 1); store.saveResults(rows); draw(); }));
  };
  draw();
}

// Testimonials: published only with the family's permission, ticked here.
function testimonials(body, toast) {
  const rows = store.testimonials();
  const draw = () => {
    body.innerHTML = `
      <ul class="quotes">${rows.map((q, i) => `<li><blockquote>“${esc(q.text)}”</blockquote><p>${esc(q.name)} · ${esc(q.detail)}</p><p class="${q.permission ? 'ok' : 'warn'}">${q.permission ? 'Permission given' : 'No permission yet: not shown'}</p><button type="button" class="btn-text" data-del="${i}">Remove</button></li>`).join('') || '<li class="empty">No testimonials yet. The two placeholders on the site stay until real ones are added here.</li>'}</ul>
      <form class="form-grid" data-add>
        <label class="fld">Quote<textarea name="text" rows="3" required></textarea></label>
        <div class="two"><label class="fld">Name<input name="name" required placeholder="Student first name or Parent"></label><label class="fld">Detail<input name="detail" placeholder="IB Year 1, Singapore"></label></div>
        <label class="check"><input type="checkbox" name="permission"> The family has agreed, in writing, to this quote appearing on the site</label>
        <div class="dr-actions"><button class="btn btn-dark" type="submit">Add testimonial</button></div>
      </form>`;
    body.querySelector('[data-add]').addEventListener('submit', e => {
      e.preventDefault();
      const f = e.target;
      rows.push({ text: f.text.value.trim(), name: f.name.value.trim(), detail: f.detail.value.trim(), permission: f.permission.checked });
      store.saveTestimonials(rows); toast('Testimonial added'); draw();
    });
    body.querySelectorAll('[data-del]').forEach(b => b.addEventListener('click', () => { rows.splice(+b.dataset.del, 1); store.saveTestimonials(rows); draw(); }));
  };
  draw();
}
