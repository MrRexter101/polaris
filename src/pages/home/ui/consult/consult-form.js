import { $, $$ } from '../../../../shared/lib/index.js';
import { BOOKING_URL, LEAD_EMAIL, WA_NUMBER, waHref } from '../../../../shared/config/index.js';

/* Consultation form: checks required fields, then hands the written-out request to WhatsApp
   (when WA_NUMBER is set) or to the visitor's email app, addressed to LEAD_EMAIL, so no request is lost.
   With a lead endpoint later, post `summary` to it where marked. */
export function initConsultForm() {
  const form = $('[data-form]');
  const submit = $('[data-submit]');
  const booking = $('[data-booking]');
  if (BOOKING_URL && booking) { booking.href = BOOKING_URL; booking.hidden = false; }

  form.addEventListener('submit', e => {
    e.preventDefault();
    if (submit.classList.contains('is-loading')) return;

    let firstBad = null;
    $$('[required]', form).forEach(input => {
      const bad = !input.value.trim();
      input.closest('.field').classList.toggle('invalid', bad);
      input.setAttribute('aria-invalid', String(bad));
      if (bad && !firstBad) firstBad = input;
    });
    if (firstBad) { firstBad.focus(); return; }

    const d = new FormData(form);
    const summary = [
      `Hi Polaris, I'm a ${d.get('who').toLowerCase()} and would like a free consultation.`,
      `Name: ${d.get('name')}`,
      `Grade: ${d.get('grade')} · Curriculum: ${d.get('curriculum')}`,
      `Targets: ${d.getAll('target').join(', ') || 'Not sure'}`,
      `Reply on ${d.get('channel')}: ${d.get('contact')}`,
      d.get('message') ? `Note: ${d.get('message')}` : '',
    ].filter(Boolean).join('\n');

    submit.classList.add('is-loading');
    submit.setAttribute('aria-busy', 'true');
    // production: send `summary` to the lead endpoint here
    setTimeout(() => {
      submit.classList.remove('is-loading');
      submit.removeAttribute('aria-busy');
      if (WA_NUMBER) window.open(waHref(summary), '_blank', 'noopener');
      else location.href = `mailto:${LEAD_EMAIL}?subject=${encodeURIComponent('Free consultation request')}&body=${encodeURIComponent(summary)}`;
      const done = $('.form-done', form);
      if (!WA_NUMBER) $('p', done).innerHTML = '<strong>Almost done.</strong> Your email app has your request ready. Press send and a Program Director will reply within an hour on business days.';
      done.hidden = false;
      done.focus();
    }, 700);
  });

  // clear a field's error as soon as it has a value
  form.addEventListener('input', e => {
    const field = e.target.closest('.field.invalid');
    if (field && e.target.value.trim()) {
      field.classList.remove('invalid');
      e.target.setAttribute('aria-invalid', 'false');
    }
  });
}
