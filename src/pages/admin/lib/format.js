// Number, money and time formats used across the admin.
export const num = n => new Intl.NumberFormat('en-SG').format(n);
export const sgd = n => `S$${new Intl.NumberFormat('en-SG').format(n)}`;
export const pct = (n, d = 1) => `${(n * 100).toFixed(d)}%`;
export const mins = m => (m == null ? '–' : m < 60 ? `${m} min` : `${Math.floor(m / 60)} h ${m % 60} min`);
export function ago(iso) {
  const h = Math.round((Date.now() - new Date(iso)) / 36e5);
  if (h < 1) return 'just now';
  if (h < 24) return `${h} h ago`;
  const d = Math.round(h / 24);
  return d === 1 ? 'yesterday' : `${d} days ago`;
}
export const shortDate = iso => new Date(iso).toLocaleDateString('en-SG', { day: 'numeric', month: 'short' });
export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
