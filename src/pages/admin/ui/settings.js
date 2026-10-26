import { BACKEND, store } from '../api/store.js';
import { STAGES } from '../model/sample-data.js';
import { esc } from '../lib/format.js';

// Settings: contact details the site uses, the backend's status, and an export of the pipeline.
export function renderSettings(view, toast) {
  const s = store.settings();
  view.innerHTML = `
  <header class="v-head"><div><h1>Settings</h1><p class="v-sentence">Contact details the site uses, and where its data lives.</p></div></header>
  <div class="set-grid">
    <form class="panel form-grid" data-form>
      <h2>Contact</h2>
      <label class="fld">WhatsApp Business number <small>Digits with country code, e.g. 6591234567</small><input name="whatsapp" value="${esc(s.whatsapp)}" inputmode="numeric" pattern="[0-9]{8,15}"></label>
      <label class="fld">Booking calendar link <small>Cal.com or Calendly</small><input name="booking" type="url" value="${esc(s.booking)}" placeholder="https://cal.com/polaris/consultation"></label>
      <label class="fld">Email for consultation requests<input name="email" type="email" value="${esc(s.email)}" required></label>
      <div class="dr-actions"><button class="btn btn-primary" type="submit">Save</button></div>
      <p class="hint">Until the backend is connected, the live site reads these from <code>src/shared/config/contact.js</code>.</p>
    </form>
    <section class="panel">
      <h2>Data</h2>
      <dl class="status">
        <div><dt>Backend</dt><dd>${BACKEND === 'sample' ? '<span class="warn">Not connected · showing sample data</span>' : 'Connected'}</dd></div>
        <div><dt>Visit tracking</dt><dd>${BACKEND === 'sample' ? 'Off' : 'On'}</dd></div>
        <div><dt>Access</dt><dd>Access code, checked in the browser (move to the server before going live)</dd></div>
      </dl>
      <p class="hint">Connecting means: create a free Supabase project, then send its project URL and public key. The form, tracking and this page then switch to real data; nothing else on the site changes.</p>
      <div class="dr-actions">
        <button type="button" class="btn btn-dark" data-export>Export pipeline (CSV)</button>
        <button type="button" class="btn-text" data-reset>Reset sample data</button>
      </div>
    </section>
  </div>`;
  view.querySelector('[data-form]').addEventListener('submit', e => {
    e.preventDefault();
    const f = e.target;
    if (!f.reportValidity()) return;
    store.saveSettings({ whatsapp: f.whatsapp.value.trim(), booking: f.booking.value.trim(), email: f.email.value.trim() });
    toast('Settings saved in this browser');
  });
  view.querySelector('[data-export]').addEventListener('click', () => {
    const cols = ['id', 'family', 'child', 'who', 'grade', 'curriculum', 'route', 'channel', 'country', 'source', 'created', 'stage', 'notes'];
    const q = v => `"${String(Array.isArray(v) ? v.join('; ') : v ?? '').replace(/"/g, '""')}"`;
    const csv = [cols.join(','), ...store.leads().map(l => cols.map(c => q(c === 'stage' ? STAGES.find(s => s.id === l.stage).name : l[c])).join(','))].join('\n');
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(new Blob([csv], { type: 'text/csv' })), download: 'polaris-pipeline-sample.csv' });
    a.click(); URL.revokeObjectURL(a.href);
  });
  view.querySelector('[data-reset]').addEventListener('click', () => { store.resetDemo(); location.reload(); });
}
