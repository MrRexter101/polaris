import { LEADS, STAGES, funnel, requestsPerDay, PACKAGE_SGD } from '../model/sample-data.js';

/* The admin's only door to data. Every screen calls these functions and nothing else, so connecting
   a real backend (Supabase is the plan) means rewriting this file only:
     leads     ← the consultation form's submissions (a `leads` table)
     traffic   ← page and click events from the site (an `events` table, or Plausible's API)
     content   ← editable sections, images (Storage) and results/testimonials
     settings  ← WhatsApp number, booking link, lead email
   Until then it serves the labelled sample data, and edits are kept in this browser only. */

export const BACKEND = 'sample';            // 'sample' | 'supabase'
const KEY = 'polaris-admin-demo';
const saved = (() => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; } })();
const persist = () => { try { localStorage.setItem(KEY, JSON.stringify(saved)); } catch { /* private mode: keep in memory */ } };

const leads = LEADS.map(l => ({ ...l, ...(saved.leads?.[l.id] ?? {}) }));

export const store = {
  // ---------- overview ----------
  overview(days = 30) {
    const f = funnel(days);
    const inWindow = leads.filter(l => f.leads.some(x => x.id === l.id));
    const enrolled = inWindow.filter(l => l.stage === 'enrolled').length;
    const replied = inWindow.filter(l => l.replyMins != null).map(l => l.replyMins).sort((a, b) => a - b);
    return {
      days,
      visitors: f.visits,
      requests: inWindow.length,
      rate: f.visits ? inWindow.length / f.visits : 0,
      enrolled,
      revenue: enrolled * PACKAGE_SGD,
      medianReply: replied.length ? replied[Math.floor(replied.length / 2)] : null,
      daily: requestsPerDay(days),
      steps: f.steps,
      waiting: leads.filter(l => l.stage === 'new').sort((a, b) => a.created.localeCompare(b.created)),
      byRoute: ['I', 'II', 'III'].map(r => ({ id: r, n: inWindow.filter(l => l.route === r).length })),
      byCountry: count(inWindow, 'country'),
      bySource: count(inWindow, 'source'),
    };
  },

  // ---------- pipeline ----------
  stages: STAGES,
  leads: () => leads,
  updateLead(id, patch) {
    const l = leads.find(x => x.id === id);
    if (!l) return;
    Object.assign(l, patch);
    (saved.leads ??= {})[id] = { ...(saved.leads[id] ?? {}), ...patch };
    persist();
  },

  // ---------- content ----------
  sections: () => saved.sections ?? DEFAULT_SECTIONS.map(s => ({ ...s })),
  saveSections(list) { saved.sections = list; persist(); },
  hero: () => saved.hero ?? { headline: 'Top grades now. A clear route to UK & US universities.', lede: '1:1 tutoring and elite mentorship for international school students aged 11–18, guided by mentors from Oxford, Cambridge, Harvard and Dartmouth.' },
  saveHero(h) { saved.hero = h; persist(); },
  images: () => saved.images ?? [],
  addImage(img) { (saved.images ??= []).unshift(img); persist(); },
  results: () => saved.results ?? [],
  saveResults(rows) { saved.results = rows; persist(); },
  testimonials: () => saved.testimonials ?? [],
  saveTestimonials(rows) { saved.testimonials = rows; persist(); },

  // ---------- settings ----------
  settings: () => ({ whatsapp: '', booking: '', email: 'team@tradewind-tech.com', ...(saved.settings ?? {}) }),
  saveSettings(s) { saved.settings = s; persist(); },
  resetDemo() { try { localStorage.removeItem(KEY); } catch { /* nothing stored */ } },
};

function count(rows, key) {
  const m = new Map();
  rows.forEach(r => m.set(r[key], (m.get(r[key]) ?? 0) + 1));
  return [...m].map(([name, n]) => ({ name, n })).sort((a, b) => b.n - a.n);
}

const DEFAULT_SECTIONS = [
  ['pathway', 'Your route (student types)'], ['video', 'Meet the director'], ['study', 'Study film'], ['package', 'The package'],
  ['impact', 'Impact projects'], ['campus', 'Campus scene'], ['mentors', 'Programme directors'], ['tutors', 'Tutors'],
  ['how', 'How it works'], ['tradewind', 'Who runs Polaris'], ['results', 'Results'], ['families', 'Families'],
  ['consult', 'Free consultation'], ['faq', 'Questions'],
].map(([id, name]) => ({ id, name, visible: id !== 'results' }));
