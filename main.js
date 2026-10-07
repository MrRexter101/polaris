// Polaris redesign interactions. No dependencies.

// Set this to the Polaris WhatsApp Business number (digits only, with country code)
// so every WhatsApp button opens a real 1:1 chat instead of the broadcast channel.
const WA_NUMBER = '';
const WA_TEXT = "Hi Polaris, I'd like to book a free consultation.";

const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const clamp01 = v => Math.min(1, Math.max(0, v));

/* A critically damped spring, the same feel as the Next.js build (Motion: stiffness 140, damping 24).
   Scroll sets the target; the value glides there with real velocity, so fast flicks never jump
   and direction changes don't snap. One rAF loop drives every spring and sleeps when all are at rest. */
const springs = new Set();
let springRaf = 0, springLast = 0;
function springLoop(now) {
  const dt = Math.min(0.032, (now - (springLast || now)) / 1000) || 0.016;
  springLast = now;
  for (const s of springs) {
    const force = -s.k * (s.x - s.target) - s.c * s.v;
    s.v += force * dt;
    s.x += s.v * dt;
    if (Math.abs(s.v) < 0.0005 && Math.abs(s.x - s.target) < 0.0005) { s.x = s.target; s.v = 0; springs.delete(s); }
    s.onChange(s.x);
  }
  springRaf = springs.size ? requestAnimationFrame(springLoop) : 0;
  if (!springRaf) springLast = 0;
}
function makeSpring(onChange, { stiffness = 140, damping = 24, initial = 0 } = {}) {
  const s = { x: initial, v: 0, target: initial, k: stiffness, c: damping, onChange };
  return {
    set(t) {
      s.target = t;
      if (reduceMotion) { s.x = t; s.v = 0; onChange(t); return; }
      springs.add(s);
      if (!springRaf) springRaf = requestAnimationFrame(springLoop);
    },
    get: () => s.x,
  };
}

const waHref = (text = WA_TEXT) =>
  WA_NUMBER ? `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(text)}` : 'https://wa.me/';
$$('[data-wa]').forEach(a => (a.href = waHref()));

/* ---------- The voyage: course line + boat through the four steps ---------- */
const voyage = $('[data-voyage]');
const course = $('[data-course]');
const line = $('[data-line]');
const wake = $('[data-wake]');
const vboat = $('[data-vboat]');
const stops = $$('[data-step]', voyage);
let waypointsY = [];
let pathLen = 0;
let target = 0;
let shown = 0;
let sailing = false;
let boatW = 46;

function buildCourse() {
  const lane = parseFloat(getComputedStyle(voyage).getPropertyValue('--lane')) || 72;
  const cx = lane / 2;
  const swing = lane * 0.26;
  const h = voyage.offsetHeight;
  course.setAttribute('viewBox', `0 0 ${lane} ${h}`);
  course.style.height = `${h}px`;

  // waypoint centres: each step's star, then the harbour light
  waypointsY = stops.map(el =>
    el.classList.contains('harbour') ? el.offsetTop + el.offsetHeight - 30 : el.offsetTop + 43
  );

  // the course passes through every waypoint star and tacks left/right between them
  let d = `M${cx} 0`;
  let y0 = 0;
  waypointsY.forEach((y1, i) => {
    const s = i % 2 ? swing : -swing;
    const dy = y1 - y0;
    d += ` C${cx + s} ${y0 + dy * 0.33} ${cx + s} ${y0 + dy * 0.67} ${cx} ${y1}`;
    y0 = y1;
  });
  line.setAttribute('d', d);
  wake.setAttribute('d', d);
  boatW = parseFloat(getComputedStyle(vboat).width) || 46;
  pathLen = line.getTotalLength();
  line.style.strokeDasharray = `${pathLen} ${pathLen}`;
  renderVoyage(shown);
}

function renderVoyage(p) {
  if (!pathLen) return;
  const len = p * pathLen;
  line.style.strokeDashoffset = String(pathLen - len);
  const pt = line.getPointAtLength(len);
  const ahead = line.getPointAtLength(Math.min(pathLen, len + 6));
  const tilt = Math.max(-14, Math.min(14, (ahead.x - pt.x) * 6));
  const w = boatW;
  vboat.style.transform = `translate3d(${pt.x - w / 2}px, ${pt.y - w * 0.82}px, 0) rotate(${tilt}deg)`;
  stops.forEach((el, i) => el.classList.toggle('is-passed', pt.y >= waypointsY[i] - 2));
}

const voyageSpring = makeSpring(v => { shown = v; renderVoyage(v); });
function updateVoyage(vh) {
  const r = voyage.getBoundingClientRect();
  voyageSpring.set(clamp01((vh * 0.62 - r.top) / r.height));
}

/* ---------- Scroll-linked chrome ---------- */
const header = $('[data-header]');
const bar = $('.progress span');
const hero = $('.hero');
const darkZones = $$('.impact-sec, .how-sec, .interlude, .footer');
const expanders = $$('[data-expand]');
const chat = $('[data-chat]');
expanders.forEach(el => {
  el._open = makeSpring(v => { el.style.setProperty('--open', v.toFixed(4)); el.classList.toggle('is-open', v > 0.6); });
  el._drift = makeSpring(v => el.style.setProperty('--drift', v.toFixed(4)), { stiffness: 90, damping: 20 });
});

let ticking = false;
function onScroll() {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(update);
}
function update() {
  ticking = false;
  const y = scrollY;
  const vh = innerHeight;
  const max = document.documentElement.scrollHeight - vh;
  const hh = header.offsetHeight;

  header.classList.toggle('is-scrolled', y > 8);
  const night = darkZones.some(z => { const r = z.getBoundingClientRect(); return r.top <= hh / 2 && r.bottom > hh / 2; });
  header.classList.toggle('is-night', night);
  const chatOnNight = darkZones.some(z => { const r = z.getBoundingClientRect(); return r.top < vh - 60 && r.bottom > vh - 60; });
  chat.classList.toggle('on-night', chatOnNight);
  bar.style.transform = `scaleX(${max > 0 ? y / max : 0})`;

  // Film bands open from an inset frame to full width as they rise into view,
  // and the footage drifts slightly slower than the page for depth
  if (!reduceMotion) expanders.forEach(el => {
    const r = el.getBoundingClientRect();
    if (r.bottom < -200 || r.top > vh + 200) return;
    el._open.set(clamp01((vh - r.top) / (vh * 0.6)));
    el._drift.set((r.top + r.height / 2 - vh / 2) / vh);
  });
  updateVoyage(vh);
}
addEventListener('scroll', onScroll, { passive: true });

let resizeTimer;
addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => { buildCourse(); update(); syncArrows(); }, 120);
});
document.fonts?.ready.then(buildCourse);
addEventListener('load', buildCourse);
buildCourse();
update();

/* ---------- Films: play only while on screen, honour reduced motion, hero pause control ---------- */
const films = $$('video[data-film]');
const heroFilm = $('.hero-video');
const filmToggle = $('[data-film-toggle]');
let heroPausedByUser = reduceMotion;
function setHeroFilm(play) {
  if (play) heroFilm.play().catch(() => {}); else heroFilm.pause();
  filmToggle.setAttribute('aria-label', play ? 'Pause background film' : 'Play background film');
  $('use', filmToggle).setAttribute('href', play ? '#pause' : '#play');
}
if (reduceMotion) { heroFilm.removeAttribute('autoplay'); setHeroFilm(false); }
else setHeroFilm(true);
filmToggle.addEventListener('click', () => { heroPausedByUser = !heroFilm.paused; setHeroFilm(heroFilm.paused); });
const filmIO = new IntersectionObserver(entries => {
  for (const { target: v, isIntersecting } of entries) {
    if (isIntersecting && !reduceMotion && !(v === heroFilm && heroPausedByUser)) {
      if (v.preload === 'none') v.preload = 'auto';
      v.play().catch(() => {});
    } else v.pause();
  }
}, { rootMargin: '200px 0px', threshold: 0 });
films.forEach(v => filmIO.observe(v));

/* ---------- Visibility-driven bits ---------- */
// draw the sample map bars once; hide floating CTAs where redundant

const map = $('.map');
const mapIO = new IntersectionObserver(([e]) => {
  if (e.isIntersecting) { map.classList.add('is-in'); mapIO.disconnect(); }
}, { threshold: 0.4 });
mapIO.observe(map);

const chatBtn = $('[data-chat-btn]');
const dock = $('[data-dock]');
const coverZones = new Map();
const coverIO = new IntersectionObserver(entries => {
  entries.forEach(e => coverZones.set(e.target, e.isIntersecting));
  const hide = [...coverZones.values()].some(Boolean);
  chat.classList.toggle('is-hidden', hide);
  dock.classList.toggle('is-hidden', hide);
  if (hide) setChat(false);
}, { threshold: 0.12 });
[hero, $('.consult-band'), $('#consult'), $('.footer')].forEach(el => coverIO.observe(el));

/* ---------- Active nav link ---------- */
const navLinks = $$('.nav a');
const navIO = new IntersectionObserver(entries => {
  for (const e of entries) {
    if (!e.isIntersecting) continue;
    navLinks.forEach(a => a.classList.toggle('is-active', a.getAttribute('href') === `#${e.target.id}`));
  }
}, { rootMargin: '-45% 0px -50% 0px' });
navLinks.map(a => $(a.getAttribute('href'))).filter(Boolean).forEach(s => navIO.observe(s));

/* ---------- Mobile menu ---------- */
const menuBtn = $('[data-menu-btn]');
const menu = $('[data-menu]');
function setMenu(open) {
  menuBtn.setAttribute('aria-expanded', String(open));
  menu.hidden = !open;
}
menuBtn.addEventListener('click', () => setMenu(menu.hidden));
menu.addEventListener('click', e => { if (e.target.closest('a')) setMenu(false); });

/* ---------- Tutor carousel ---------- */
const track = $('[data-track]');
const [prevBtn, nextBtn] = $$('[data-scroll]');
const cardStep = () => ($('.tutor', track)?.offsetWidth ?? 280) + 20;
$$('[data-scroll]').forEach(b =>
  b.addEventListener('click', () => track.scrollBy({ left: Number(b.dataset.scroll) * cardStep(), behavior: reduceMotion ? 'auto' : 'smooth' }))
);
function syncArrows() {
  prevBtn.disabled = track.scrollLeft < 4;
  nextBtn.disabled = track.scrollLeft + track.clientWidth >= track.scrollWidth - 4;
}
track.addEventListener('scroll', syncArrows, { passive: true });
syncArrows();

/* ---------- Video facade: load YouTube only on click ---------- */
$$('[data-video]').forEach(box => {
  $('.video-facade', box).addEventListener('click', () => {
    const f = document.createElement('iframe');
    f.src = `https://www.youtube-nocookie.com/embed/${box.dataset.video}?autoplay=1&rel=0`;
    f.title = box.querySelector('.video-facade')?.getAttribute('aria-label')?.replace('Play film: ', '').replace('Play video: ', '') || 'Film';
    f.allow = 'autoplay; encrypted-media; picture-in-picture';
    f.allowFullscreen = true;
    box.replaceChildren(f);
  });
});

/* ---------- Chat launcher ---------- */
function setChat(open) {
  chat.classList.toggle('is-open', open);
  chatBtn.setAttribute('aria-expanded', String(open));
}
chatBtn.addEventListener('click', () => setChat(!chat.classList.contains('is-open')));
document.addEventListener('click', e => { if (!chat.contains(e.target)) setChat(false); });
addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  if (chat.classList.contains('is-open')) { setChat(false); chatBtn.focus(); }
  if (!menu.hidden) { setMenu(false); menuBtn.focus(); }
});

/* ---------- Consultation form ---------- */
const form = $('[data-form]');
const submit = $('[data-submit]');
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
    d.get('message') ? `Note: ${d.get('message')}` : ''
  ].filter(Boolean).join('\n');

  // Prototype: hand off to WhatsApp when a number is configured.
  // In production, post `summary` to the form's email/webhook endpoint here instead.
  submit.classList.add('is-loading');
  submit.setAttribute('aria-busy', 'true');
  setTimeout(() => {
    submit.classList.remove('is-loading');
    submit.removeAttribute('aria-busy');
    if (WA_NUMBER) window.open(waHref(summary), '_blank', 'noopener');
    const done = $('.form-done', form);
    done.hidden = false;
    done.focus();
  }, 700);
});
form.addEventListener('input', e => {
  const field = e.target.closest('.field.invalid');
  if (field && e.target.value.trim()) {
    field.classList.remove('invalid');
    e.target.setAttribute('aria-invalid', 'false');
  }
});


/* ---------- Director profiles: the sheet grows out of the card you pressed ---------- */
const sheet = $('[data-sheet]');
const sheetCard = $('[data-sheet-card]');
let lastCard = null;
$$('[data-dir]').forEach(card => card.addEventListener('click', () => {
  lastCard = card;
  sheetCard.replaceChildren($(`#dir-${card.dataset.dir}`).content.cloneNode(true));
  const ask = $('[data-wa-ask]', sheetCard);
  if (ask) ask.href = waHref(`Hi Polaris, I'd like to ask ${ask.dataset.waAsk} a question about `);
  sheet.showModal();
  sheet.scrollTop = 0;
  $('[data-sheet-close]').focus({ preventScroll: true });
  document.documentElement.style.overflow = 'hidden';
  if (reduceMotion) return;
  const from = card.getBoundingClientRect(), to = sheet.getBoundingClientRect();
  const dx = from.left + from.width / 2 - (to.left + to.width / 2);
  const dy = from.top + from.height / 2 - (to.top + to.height / 2);
  const s = Math.max(from.width / to.width, 0.25);
  sheet.animate(
    [{ transform: `translate(${dx}px, ${dy}px) scale(${s})`, opacity: 0.4 }, { transform: 'none', opacity: 1 }],
    { duration: 420, easing: 'cubic-bezier(0.32, 0.72, 0, 1)' }
  );
}));
function closeSheet() {
  if (!sheet.open) return;
  const done = () => { sheet.close(); document.documentElement.style.overflow = ''; lastCard?.focus(); };
  if (reduceMotion || !lastCard) return done();
  const from = lastCard.getBoundingClientRect(), to = sheet.getBoundingClientRect();
  const dx = from.left + from.width / 2 - (to.left + to.width / 2);
  const dy = from.top + from.height / 2 - (to.top + to.height / 2);
  sheet.animate(
    [{ transform: 'none', opacity: 1 }, { transform: `translate(${dx}px, ${dy}px) scale(${Math.max(from.width / to.width, 0.25)})`, opacity: 0 }],
    { duration: 260, easing: 'cubic-bezier(0.4, 0, 1, 1)' }
  ).onfinish = done;
}
$('[data-sheet-close]').addEventListener('click', closeSheet);
sheet.addEventListener('cancel', e => { e.preventDefault(); closeSheet(); });
sheet.addEventListener('click', e => { if (e.target === sheet) closeSheet(); });

/* ---------- Rolling price ---------- */
$$('[data-odo]').forEach(el => {
  const digits = el.dataset.odo.split('');
  el.replaceChildren(...digits.map(d => {
    const col = document.createElement('span'); col.className = 'odo-col';
    const reel = document.createElement('span'); reel.className = 'odo-reel';
    reel.innerHTML = '0123456789'.split('').map(n => `<span>${n}</span>`).join('');
    reel.dataset.to = d; col.append(reel); return col;
  }));
  const roll = () => $$('.odo-reel', el).forEach((r, i) => {
    r.style.transitionDelay = `${i * 120}ms`;
    r.style.transform = `translateY(${-Number(r.dataset.to) * 10}%)`;
  });
  if (reduceMotion) return roll();
  const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { roll(); io.disconnect(); } }, { rootMargin: '0px 0px -15% 0px' });
  io.observe(el);
});


/* ---------- Tradewind: the same scene as the Next.js build ----------
   Pinned for 240vh. The sail runs 10%→85% of the pin; each stage lifts and lights over the
   8% of travel before the sail reaches it (stage i at 0.10 + i·0.375), all on the shared spring. */
const twPin = $('[data-tw-pin]');
const twStages = $$('[data-tw-stage]');
const lerp = (a, b, t) => a + (b - a) * t;
function renderTw(p) {
  const sail = clamp01((p - 0.1) / 0.75);
  twPin.style.setProperty('--tw', sail.toFixed(4));
  twPin.style.setProperty('--twp', p.toFixed(4));
  twStages.forEach((el, i) => {
    const at = 0.1 + i * 0.375;
    const lit = clamp01((p - (at - 0.08)) / 0.08);
    el.style.opacity = lerp(0.45, 1, lit).toFixed(3);
    el.style.transform = `translate3d(0, ${lerp(10, 0, lit).toFixed(2)}px, 0)`;
    el.style.setProperty('--lit', lit.toFixed(3));
  });
}
const twSpring = twPin && makeSpring(renderTw);
function sizeTwPin() {
  const sticky = $('.tw-sticky', twPin);
  const pinned = getComputedStyle(sticky).position === 'sticky' && !reduceMotion;
  if (!twPin) return;
  twPin.style.height = pinned ? `${sticky.offsetHeight + innerHeight * 1.2}px` : '';
}
function twUpdate() {
  if (!twPin) return;
  const pinned = getComputedStyle($('.tw-sticky', twPin)).position === 'sticky';
  if (!pinned || reduceMotion) { renderTw(1); return; }
  const r = twPin.getBoundingClientRect();
  twSpring.set(clamp01(-r.top / Math.max(1, r.height - innerHeight)));
}
addEventListener('scroll', twUpdate, { passive: true });
addEventListener('resize', () => { sizeTwPin(); twUpdate(); });
if (twPin) { sizeTwPin(); document.fonts?.ready.then(sizeTwPin); }
twUpdate();

/* ---------- Study film: scroll plays the clip, so the pen moves as you scroll ---------- */
const study = $('[data-study]');
const scrub = $('[data-scrub]');
let scrubTarget = 0, scrubShown = 0, scrubRaf = 0, seeking = false, pendingSeek = null;
function seekTo(t) {
  if (!scrub.duration) return;
  const want = Math.min(1, Math.max(0, t)) * (scrub.duration - 0.05);
  if (seeking) { pendingSeek = want; return; }        // never queue seeks while the decoder is busy
  seeking = true;
  try { scrub.currentTime = want; } catch { seeking = false; }
}
scrub?.addEventListener('seeked', () => {
  seeking = false;
  if (pendingSeek !== null) { const n = pendingSeek; pendingSeek = null; seeking = true; scrub.currentTime = n; }
});
scrub?.addEventListener('loadedmetadata', () => seekTo(scrubShown));
const scrubSpring = makeSpring(v => { scrubShown = v; seekTo(v); study?.style.setProperty('--push', v.toFixed(4)); }, { stiffness: 120, damping: 22 });
// iOS won't paint a seeked frame on a video that has never played: prime it on first touch
['touchstart', 'pointerdown', 'wheel', 'keydown'].forEach(ev => addEventListener(ev, () => {
  scrub?.play().then(() => scrub.pause()).catch(() => {});
}, { once: true, passive: true }));
function studyUpdate() {
  if (!study) return;
  const frame = study.parentElement;
  const r = frame.getBoundingClientRect();
  frame.style.setProperty('--frame-h', `${r.height}px`);
  if (reduceMotion || r.bottom < 0 || r.top > innerHeight) return;
  const p = clamp01((innerHeight - r.top) / (innerHeight + r.height)); // whole pass through the viewport
  scrubSpring.set(p);
}
addEventListener('scroll', studyUpdate, { passive: true });
addEventListener('resize', studyUpdate);
studyUpdate();

/* ---------- Results: add real, verifiable numbers here. Empty lists keep the section hidden. ---------- */
const RESULTS = {
  admits: [],   // e.g. { uni: 'University of Oxford', count: 3, year: '2026' }
  stats: [],    // e.g. { value: 92, suffix: '%', label: 'raised at least one predicted grade within one package' }
  rates: [],    // e.g. { uni: 'Oxbridge', average: 17, polaris: 40 }  (published rate vs Polaris, same year)
};
const SAMPLE = {
  admits: ['Oxford', 'Cambridge', 'Imperial', 'UCL', 'LSE', 'NUS', 'UC Berkeley', 'UCLA'].map(uni => ({ uni, count: 0 })),
  stats: [{ value: 0, suffix: '%', label: 'Sample: share of students who raised a predicted grade' }, { value: 0, label: 'Sample: university offers this cycle' }],
  rates: ['Oxbridge', 'Imperial', 'UCL'].map(uni => ({ uni, average: 0, polaris: 0 })),
};
(function renderResults() {
  const sec = $('[data-results]');
  if (!sec) return;
  const hasReal = RESULTS.admits.length || RESULTS.stats.length || RESULTS.rates.length;
  const local = ['localhost', '127.0.0.1'].includes(location.hostname);
  if (!hasReal && !local) return;
  const R = hasReal ? RESULTS : SAMPLE;
  sec.hidden = false;
  $('[data-sample-banner]').hidden = !!hasReal;
  if (R.admits.length) {
    const track = $('[data-res-track]');
    const item = a => `<li><span class="res-count">${a.count}+</span><span>offers from <strong>${a.uni}</strong>${a.year ? ` · ${a.year}` : ''}</span></li>`;
    track.innerHTML = [...R.admits, ...R.admits].map(item).join('');
    track.style.setProperty('--dur', `${R.admits.length * 4}s`);
    $('[data-res-marquee]').hidden = false;
    $('[data-res-marquee]').setAttribute('aria-label', R.admits.map(a => `${a.count} offers from ${a.uni}`).join(', '));
  }
  const grid = $('[data-res-grid]');
  grid.innerHTML = R.stats.map(s => `<div class="res-stat"><p class="res-big">${s.value}${s.suffix ?? ''}</p><p>${s.label}</p></div>`).join('')
    + (R.rates.length ? `<div class="res-rates"><h3>Acceptance rates</h3><p class="res-legend"><i class="res-avg"></i>Published average <i class="res-pol"></i>Polaris students</p>`
      + R.rates.map(r => `<div class="res-row"><span>${r.uni}</span><div class="res-bars">`
        + `<div class="res-bar"><i class="res-avg" data-w="${r.average}"></i><b>${r.average}%</b></div>`
        + `<div class="res-bar"><i class="res-pol" data-w="${r.polaris}"></i><b>${r.polaris}%</b></div></div></div>`).join('') + '</div>' : '');
  const max = Math.max(1, ...R.rates.flatMap(r => [r.average, r.polaris]));
  const bars = $$('.res-bar i', grid);
  const grow = () => bars.forEach((b, i) => { b.style.transitionDelay = `${i * 60}ms`; b.style.transform = `scaleX(${Math.max(0.02, Number(b.dataset.w) / max)})`; });
  if (reduceMotion) return grow();
  const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { grow(); io.disconnect(); } }, { rootMargin: '0px 0px -15% 0px' });
  if (bars.length) io.observe(grid);
})();


/* Chapter rules draw in once as each section arrives */
(() => {
  const marks = $$('.chapter');
  if (reduceMotion || !('IntersectionObserver' in window)) { marks.forEach(m => m.classList.add('is-in')); return; }
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -10% 0px' });
  marks.forEach(m => io.observe(m));
})();
