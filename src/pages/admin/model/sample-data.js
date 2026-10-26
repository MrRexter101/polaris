/* SAMPLE DATA for the admin, so the screens can be designed and reviewed before a backend exists.
   None of it is real: the families, numbers and dates are invented and labelled "Sample" everywhere.
   Everything is generated from a fixed seed, so it is the same on every load, and every total
   the screens show is computed from these rows (never typed in separately). */

export const PACKAGE_SGD = 880;

// Pipeline stages, in order, in the words the team uses
export const STAGES = [
  { id: 'new', name: 'New request', hint: 'Waiting for our first reply' },
  { id: 'replied', name: 'Replied', hint: 'We answered; waiting on the family' },
  { id: 'booked', name: 'Consultation booked', hint: 'A time is agreed' },
  { id: 'held', name: 'Consultation held', hint: 'Deciding after the call' },
  { id: 'enrolled', name: 'Enrolled', hint: 'Paid the package' },
  { id: 'lost', name: 'Not now', hint: 'Chose to wait or go elsewhere' },
];

export const ROUTES = [
  { id: 'I', name: 'Type I · Elite universities', programme: 'Polaris' },
  { id: 'II', name: 'Type II · Top 20, faster', programme: 'Odyssey' },
  { id: 'III', name: 'Type III · Juniors and seniors', programme: 'Odyssey' },
];

// deterministic random (mulberry32)
function rng(seed) {
  return () => {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = rng(20261025);
const pick = list => list[Math.floor(rand() * list.length)];

const DAYS = 60;
const today = new Date(); today.setHours(0, 0, 0, 0);
// local calendar day (toISOString would shift evening requests in Asia onto the wrong day)
export const dayStr = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const daysAgo = n => { const d = new Date(today); d.setDate(d.getDate() - n); return d; };

/* ---------- traffic: one row per day ---------- */
export const DAILY = Array.from({ length: DAYS }, (_, i) => {
  const date = daysAgo(DAYS - 1 - i);
  const weekend = [0, 6].includes(date.getDay());
  const trend = 1 + i / DAYS * 0.5;                     // a site that is slowly being found
  const visitors = Math.round((weekend ? 70 : 105) * trend * (0.8 + rand() * 0.4));
  return { date: dayStr(date), visitors };
});

/* ---------- families (leads) ---------- */
const FAMILIES = ['Tan', 'Lim', 'Park', 'Kim', 'Lee', 'Srisawat', 'Chen', 'Wong', 'Nguyen', 'Choi', 'Ong', 'Rahman', 'Suzuki', 'Patel',
  'Chua', 'Jung', 'Wattana', 'Ho', 'Goh', 'Yoon', 'Sato', 'Teo', 'Kang', 'Liu', 'Han', 'Pham', 'Ng', 'Bae'];
const CHILD = ['Ethan', 'Chloe', 'Minjun', 'Seoyeon', 'Aiden', 'Pim', 'Jasmine', 'Daniel', 'Hana', 'Ryan', 'Mei', 'Arjun', 'Yuna', 'Lucas', 'Sofia', 'Kai'];
const GRADES = ['Grade 6–8', 'Grade 9–10', 'Grade 11–12 / IB DP', 'Grade 11–12 / IB DP', 'Grade 9–10'];
const CURRICULA = ['IB', 'IB', 'A-Level / IGCSE', 'American (AP)'];
const TARGETS = [['UK'], ['US'], ['UK', 'US'], ['US', 'Asia'], ['UK', 'Asia'], ['Not sure']];
const CHANNELS = ['WhatsApp', 'WhatsApp', 'LINE', 'KakaoTalk', 'Email'];
const COUNTRIES = [['Singapore', 'SG'], ['Singapore', 'SG'], ['Thailand', 'TH'], ['Thailand', 'TH'], ['South Korea', 'KR'], ['Hong Kong', 'HK'], ['Indonesia', 'ID']];
export const SOURCES = ['Google search', 'Direct', 'Instagram', 'Shared on WhatsApp', 'Odyssey site', 'LINE'];

export const LEADS = Array.from({ length: 34 }, (_, i) => {
  const age = Math.floor(Math.pow(rand(), 0.9) * (DAYS - 1));  // days since the request
  const route = rand() < 0.62 ? 'I' : rand() < 0.6 ? 'II' : 'III';
  // older requests have travelled further down the pipeline
  const r = rand() + age / DAYS * 0.9;
  const stage = age <= 2 ? (rand() < 0.75 ? 'new' : 'replied')
    : r < 0.45 ? 'replied' : r < 0.8 ? 'booked' : r < 1.15 ? 'held' : r < 1.45 ? 'enrolled' : 'lost';
  const [country, cc] = pick(COUNTRIES);
  const created = daysAgo(age);
  created.setHours(8 + Math.floor(rand() * 13), Math.floor(rand() * 60));
  return {
    id: `L${String(1001 + i)}`,
    family: `${pick(FAMILIES)} family`,
    child: pick(CHILD),
    who: rand() < 0.82 ? 'Parent' : 'Student',
    grade: pick(GRADES),
    curriculum: pick(CURRICULA),
    targets: pick(TARGETS),
    route,
    channel: pick(CHANNELS),
    country, cc,
    source: pick(SOURCES),
    created: created.toISOString(),
    day: dayStr(created),
    replyMins: stage === 'new' ? null : Math.round(8 + Math.pow(rand(), 2) * 170),
    stage,
    notes: '',
  };
}).sort((a, b) => b.created.localeCompare(a.created));

/* ---------- the funnel for a window of days, built from the rows above ---------- */
export function funnel(days) {
  const since = daysAgo(days - 1);
  const visits = DAILY.slice(-days).reduce((s, d) => s + d.visitors, 0);
  const leads = LEADS.filter(l => new Date(l.created) >= since);
  const reached = s => leads.filter(l => STAGES.findIndex(x => x.id === l.stage) >= STAGES.findIndex(x => x.id === s) && l.stage !== 'lost').length;
  const requested = leads.length;
  // the in-page steps scale from visits, never below the step after them
  const choseRoute = Math.max(requested, Math.round(visits * 0.31));
  const sawPackage = Math.max(requested, Math.round(choseRoute * 0.62));
  const openedForm = Math.max(requested, Math.round(sawPackage * 0.22));
  const steps = [
    { name: 'Visited', n: visits },
    { name: 'Chose a route', n: choseRoute },
    { name: 'Reached the package', n: sawPackage },
    { name: 'Started the form', n: openedForm },
    { name: 'Requested a consultation', n: requested },
    { name: 'Consultation booked', n: reached('booked') },
    { name: 'Enrolled', n: reached('enrolled') },
  ];
  steps.forEach((s, i) => i && console.assert(s.n <= steps[i - 1].n, `funnel step "${s.name}" exceeds the step before it`));
  return { visits, leads, steps };
}

// the daily request counts come from the leads, so the chart and the KPI always agree
export function requestsPerDay(days) {
  return DAILY.slice(-days).map(d => ({ ...d, requests: LEADS.filter(l => l.day === d.date).length }));
}

const check = funnel(30);
console.assert(requestsPerDay(30).reduce((s, d) => s + d.requests, 0) === check.leads.length, 'daily requests must add up to the 30-day total');
