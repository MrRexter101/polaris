import { $, $$, reduceMotion } from '../../../../shared/lib/index.js';
import { waHref } from '../../../../shared/config/index.js';

/* Director profiles: each card is a button; its <template id="dir-…"> fills a <dialog>
   that grows out of the card you pressed and shrinks back into it on close. */
export function initDirectorSheet() {
  const sheet = $('[data-sheet]');
  const card = $('[data-sheet-card]');
  const closeBtn = $('[data-sheet-close]');
  let lastCard = null;

  // the transform that puts the sheet over the card
  const fromCard = el => {
    const from = el.getBoundingClientRect(), to = sheet.getBoundingClientRect();
    const dx = from.left + from.width / 2 - (to.left + to.width / 2);
    const dy = from.top + from.height / 2 - (to.top + to.height / 2);
    return `translate(${dx}px, ${dy}px) scale(${Math.max(from.width / to.width, 0.25)})`;
  };

  $$('[data-dir]').forEach(btn => btn.addEventListener('click', () => {
    lastCard = btn;
    card.replaceChildren($(`#dir-${btn.dataset.dir}`).content.cloneNode(true));
    const ask = $('[data-wa-ask]', card);
    if (ask) ask.href = waHref(`Hi Polaris, I'd like to ask ${ask.dataset.waAsk} a question about `);
    sheet.showModal();
    // focus the sheet itself, so no ring flashes on the close button; Tab reaches it next
    card.tabIndex = -1;
    card.focus({ preventScroll: true });
    const body = $('.sheet-body', card);
    const atEnd = () => body.classList.toggle('at-end', body.scrollTop + body.clientHeight >= body.scrollHeight - 8);
    body.addEventListener('scroll', atEnd, { passive: true });
    requestAnimationFrame(atEnd);
    document.documentElement.style.overflow = 'hidden';
    if (reduceMotion) return;
    sheet.animate(
      [{ transform: fromCard(btn), opacity: 0.4 }, { transform: 'none', opacity: 1 }],
      { duration: 420, easing: 'cubic-bezier(0.32, 0.72, 0, 1)' }
    );
  }));

  function close() {
    if (!sheet.open) return;
    const done = () => { sheet.close(); document.documentElement.style.overflow = ''; lastCard?.focus(); };
    if (reduceMotion || !lastCard) return done();
    sheet.animate(
      [{ transform: 'none', opacity: 1 }, { transform: fromCard(lastCard), opacity: 0 }],
      { duration: 260, easing: 'cubic-bezier(0.4, 0, 1, 1)' }
    ).onfinish = done;
  }
  closeBtn.addEventListener('click', close);
  sheet.addEventListener('cancel', e => { e.preventDefault(); close(); });
  sheet.addEventListener('click', e => { if (e.target === sheet) close(); });
}
