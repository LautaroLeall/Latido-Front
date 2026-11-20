/**
 * Datos de contacto comercial de Latido (WhatsApp / email de ventas).
 * Se pueden cambiar sin tocar código con VITE_CONTACT_WHATSAPP y VITE_CONTACT_EMAIL.
 */
export const CONTACT_WHATSAPP = (import.meta.env.VITE_CONTACT_WHATSAPP || '5493813399463').replace(/\D/g, '');
export const CONTACT_EMAIL = (import.meta.env.VITE_CONTACT_EMAIL || 'lautaroleal4@gmail.com').trim();

// "+54 9 381 339 9463"
export function displayPhone(digits = CONTACT_WHATSAPP) {
  const d = String(digits).replace(/\D/g, '');
  if (d.startsWith('549') && d.length === 13) return `+54 9 ${d.slice(3, 6)} ${d.slice(6, 9)} ${d.slice(9)}`;
  return `+${d}`;
}

export function buildWhatsAppUrl(text = '') {
  return `https://wa.me/${CONTACT_WHATSAPP}?text=${encodeURIComponent(text)}`;
}

export function buildMailUrl(subject = '', body = '', to = CONTACT_EMAIL) {
  return `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export function buildGmailUrl(subject = '', body = '', to = CONTACT_EMAIL) {
  return `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(to)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
