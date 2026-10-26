// Contact settings, in one place.

// The Polaris WhatsApp Business number: digits only, with country code (e.g. '6591234567').
// While empty, WhatsApp buttons open wa.me without a chat, and form requests go by email instead.
export const WA_NUMBER = '';
// Where form requests go while there is no WhatsApp number (the address in the footer).
export const LEAD_EMAIL = 'team@tradewind-tech.com';
// Your Cal.com or Calendly link for consultations (e.g. 'https://cal.com/polaris/consultation').
// When set, the consultation form offers "Or pick a time on our calendar".
export const BOOKING_URL = '';
export const WA_TEXT = "Hi Polaris, I'd like to book a free consultation.";

export const waHref = (text = WA_TEXT) =>
  WA_NUMBER ? `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(text)}` : 'https://wa.me/';
