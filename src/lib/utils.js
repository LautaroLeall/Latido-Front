import { normalizeWhatsAppDigits, validateEmail, validatePhone } from './validators.js';
import { SITE_URL } from './seoConfig.js';

/**
 * Normaliza números de teléfono al formato internacional E.164 (ej: +5493815551234)
 */
export function formatE164(phone) {
  const wa = normalizeWhatsAppDigits(phone);
  return wa ? `+${wa}` : '';
}

/**
 * Extrae solo el primer nombre de un nombre completo para comunicación cercana
 */
export function getFirstName(fullName) {
  if (!fullName) return '';
  return fullName.trim().split(/\s+/)[0] || '';
}

/**
 * Monograma de 2 letras a partir del nombre del negocio.
 * Ignora conectores ("del", "de", "la"...) → "Cafetería del Sol" = "CS"
 */
const CONECTORES = new Set(['de', 'del', 'la', 'las', 'el', 'los', 'y', 'e', '&']);
export function getMonogram(name) {
  if (!name) return 'LT';
  const words = name.trim().split(/\s+/).filter(w => !CONECTORES.has(w.toLowerCase()));
  if (words.length === 0) return name.slice(0, 2).toUpperCase();
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

/**
 * Reemplaza variables {variable} dentro de una plantilla de mensaje.
 * Respeta los saltos de línea (solo colapsa espacios horizontales repetidos).
 */
export function fillTemplate(template, vars = {}) {
  if (!template) return '';
  return template
    .replace(/\{(\w+)\}/g, (_, key) => (vars[key] != null ? vars[key] : ''))
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

/**
 * Genera enlaces estándar directos validando que el contacto tenga datos reales
 * (WhatsApp wa.me normalizado con código de país, mailto, gmail web o tel).
 * Las plantillas ya incluyen la firma, así que no se agrega nada extra al cuerpo.
 */
export function getContactUrl(channel, contact = {}, text = '', options = {}) {
  const { subject = '' } = options;

  if (channel === 'whatsapp') {
    const ph = validatePhone(contact.phone || '', { required: true });
    if (!ph.valid || !ph.whatsappDigits) return null;
    return `https://wa.me/${ph.whatsappDigits}?text=${encodeURIComponent(text)}`;
  }

  if (channel === 'email') {
    const em = validateEmail(contact.email || '', { required: true });
    if (!em.valid) return null;
    return `mailto:${encodeURIComponent(em.value)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`;
  }

  if (channel === 'gmail') {
    const em = validateEmail(contact.email || '', { required: true });
    if (!em.valid) return null;
    return `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(em.value)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`;
  }

  if (channel === 'call') {
    const ph = validatePhone(contact.phone || '', { required: true });
    if (!ph.valid || !ph.whatsappDigits) return null;
    return `tel:+${ph.whatsappDigits}`;
  }

  return null;
}

/**
 * Abre una URL externa (https / mailto / tel) siempre en otra pestaña con noopener/noreferrer
 * para nunca sacar al usuario ni romper la pestaña principal de Latido.
 */
export function openExternalInNewTab(url) {
  if (typeof url !== 'string' || !/^(https:\/\/|mailto:|tel:)/i.test(url)) {
    return false;
  }
  try {
    const win = window.open(url, '_blank', 'noopener,noreferrer');
    if (win) return true;
  } catch {
    // Fallback abajo si window.open fue bloqueado
  }
  try {
    const a = document.createElement('a');
    a.href = url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    a.remove();
    return true;
  } catch {
    return false;
  }
}

/**
 * Formato de moneda local (ARS por defecto)
 */
export function formatMoney(amount, currency = 'ARS') {
  const value = Math.round(Number(amount) || 0).toLocaleString('es-AR');
  return currency === 'ARS' ? `$ ${value}` : `${currency} ${value}`;
}

/**
 * "hace 5 min", "hace 3 h", "hace 2 días"
 */
export function formatRelative(date, now = Date.now()) {
  if (!date) return '';
  const diffMin = Math.max(0, Math.round((now - new Date(date).getTime()) / 60000));
  if (diffMin < 1) return 'recién';
  if (diffMin < 60) return `hace ${diffMin} min`;
  const h = Math.round(diffMin / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.round(h / 24);
  return `hace ${d} ${d === 1 ? 'día' : 'días'}`;
}

/**
 * Fecha y hora corta en formato argentino
 */
export function formatDateTime(date) {
  if (!date) return '';
  return new Date(date).toLocaleString('es-AR', {
    day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit'
  });
}

/**
 * Normaliza texto para búsquedas sin tildes ni distinción de mayúsculas
 */
export function normalizeSearch(str = '') {
  return String(str).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

/**
 * Comprueba que una URL externa use estrictamente HTTPS sin espacios
 */
export function isSafeHttpsUrl(url) {
  return typeof url === 'string' && /^https:\/\/\S+$/i.test(url);
}

/**
 * URL base pública de la app (sin barra final)
 */
export function getAppBaseUrl() {
  return (import.meta.env.VITE_APP_URL || window.location.origin).replace(/\/+$/, '');
}

/**
 * URL pública del ticket para probar desde el entorno actual (dev o prod)
 */
export function buildFeedbackUrl(token) {
  return `${getAppBaseUrl()}/f/${token}`;
}

/**
 * URL canónica HTTPS de producción para imprimir QR y grabar chips NFC NTAG213.
 * Nunca genera http://localhost incluso si el Super Admin trabaja en entorno local.
 */
export function buildKitUrl(token) {
  return `${SITE_URL}/f/${token}`;
}

/**
 * Etiquetas legibles de canal de contacto
 */
export const CHANNEL_LABELS = {
  whatsapp: 'WhatsApp',
  email: 'Email',
  call: 'Llamada'
};

/**
 * Etiquetas legibles de resultado de rescate
 */
export const OUTCOME_LABELS = {
  recovered: 'Rescatado',
  no_response: 'Sin respuesta',
  declined: 'Rechazó compensación'
};
