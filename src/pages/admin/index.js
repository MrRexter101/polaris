import { isSignedIn, signIn, signOut } from './lib/access.js';
import { renderOverview } from './ui/overview.js';
import { renderPipeline } from './ui/pipeline.js';
import { renderContent } from './ui/content.js';
import { renderSettings } from './ui/settings.js';

// Public API of the admin page: the access gate, then a small hash router (#overview, #pipeline/<id>, #content/<tab>, #settings).
export function initAdminPage() {
  const gate = document.querySelector('[data-gate]');
  const app = document.querySelector('[data-app]');
  const view = document.querySelector('[data-view]');
  const toastEl = document.querySelector('[data-toast]');
  let toastTimer;
  const toast = msg => {
    toastEl.textContent = msg;
    toastEl.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('is-on'), 2600);
  };

  const route = () => {
    const [page = 'overview', arg] = location.hash.slice(1).split('/');
    document.querySelectorAll('[data-nav]').forEach(a => a.toggleAttribute('aria-current', a.dataset.nav === page));
    if (page === 'pipeline') renderPipeline(view, arg, toast);
    else if (page === 'content') renderContent(view, arg, toast);
    else if (page === 'settings') renderSettings(view, toast);
    else renderOverview(view);
    view.focus({ preventScroll: true });
    scrollTo(0, 0);
  };

  const enter = () => { gate.hidden = true; app.hidden = false; route(); };
  if (isSignedIn()) enter();
  else {
    const form = document.querySelector('[data-gate-form]');
    const err = document.querySelector('[data-gate-err]');
    form.code.focus();
    form.addEventListener('submit', async e => {
      e.preventDefault();
      if (await signIn(form.code.value)) return enter();
      err.hidden = false;
      form.code.select();
      form.querySelector('.gate-card, input').animate([{ translate: '0' }, { translate: '-6px' }, { translate: '6px' }, { translate: '0' }], { duration: 240 });
    });
  }
  addEventListener('hashchange', () => { if (!app.hidden) route(); });
  document.querySelector('[data-signout]').addEventListener('click', () => { signOut(); location.reload(); });
}
