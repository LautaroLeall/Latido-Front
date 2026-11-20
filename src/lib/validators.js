/**
 * Validaciones centralizadas de Latido (datos reales y consistentes en toda la app).
 * Todas devuelven `{ valid: boolean, value?: any, error?: string }` salvo helpers explícitos.
 */

const EMAIL_RE = /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/i;
const PERSON_NAME_RE = /^[\p{L}][\p{L}\s'.-]*[\p{L}.]$/u;
const BUSINESS_NAME_RE = /^[\p{L}\p{N}\s&.,'"+/°ªº()\-–—]+$/u;
const PHONE_CHARS_RE = /^[+\d\s().-]+$/;
const HTML_TAG_RE = /<[^>]*>/;
const REPEAT_CHAR_RE = /(.)\1{4,}/iu;
const GOOGLE_DOMAIN_RE = /^(?:[a-z0-9-]+\.)*(?:g\.page|goo\.gl|google\.[a-z]{2,}(?:\.[a-z]{2})?)$/i;

const WEAK_PASSWORDS = new Set([
  '12345678', '123456789', '1234567890', '00000000', '11111111',
  'password', 'password1', 'qwerty12', 'qwerty123', 'abc12345',
  'admin123', 'latido123', 'contrasena', 'contraseña'
]);

const FAKE_PHONE_SEQUENCES = new Set([
  '01234567', '12345678', '123456789', '1234567890', '987654321', '9876543210'
]);

export function collapseSpaces(raw) {
  return String(raw ?? '').replace(/\s+/g, ' ').trim();
}

/**
 * Email real: tiene @, sin espacios, sin puntos seguidos y dominio con TLD de al menos 2 letras.
 */
export function validateEmail(raw, { required = true, label = 'El email' } = {}) {
  const value = String(raw ?? '').trim().toLowerCase();
  if (!value) {
    return required ? { valid: false, value: '', error: `Ingresá ${label.toLowerCase()}.` } : { valid: true, value: '' };
  }
  if (value.length > 254 || /\s/.test(value) || value.includes('..') || !EMAIL_RE.test(value)) {
    return { valid: false, value, error: `${label} no es válido (ej: nombre@dominio.com).` };
  }
  const [local, domain] = value.split('@');
  const tld = domain.split('.').pop() || '';
  if (!local || local.startsWith('.') || local.endsWith('.') || !/^[a-z]{2,24}$/i.test(tld)) {
    return { valid: false, value, error: `${label} debe tener un dominio válido (ej: @gmail.com).` };
  }
  return { valid: true, value };
}

/**
 * Nombre de persona (dueño, encargado o cliente): solo letras, tildes, ñ, espacios, guion o apóstrofe.
 * Rechaza números, símbolos raros o basura repetida.
 */
export function validatePersonName(
  raw,
  { required = true, min = 2, max = 80, requireTwoWords = false, label = 'El nombre' } = {}
) {
  const value = collapseSpaces(raw);
  if (!value) {
    return required ? { valid: false, value: '', error: `Ingresá ${label.toLowerCase()}.` } : { valid: true, value: '' };
  }
  if (value.length < min || value.length > max) {
    return { valid: false, value, error: `${label} debe tener entre ${min} y ${max} caracteres.` };
  }
  if (/\d/.test(value)) {
    return { valid: false, value, error: `${label} no puede contener números.` };
  }
  if (!PERSON_NAME_RE.test(value) || REPEAT_CHAR_RE.test(value)) {
    return { valid: false, value, error: `${label} debe contener solo letras válidas (sin símbolos raros).` };
  }
  const letterCount = (value.match(/\p{L}/gu) || []).length;
  if (letterCount < min) {
    return { valid: false, value, error: `${label} debe tener al menos ${min} letras.` };
  }
  if (requireTwoWords) {
    const words = value.split(' ').filter(w => (w.match(/\p{L}/gu) || []).length >= 2);
    if (words.length < 2) {
      return { valid: false, value, error: 'Ingresá tu nombre y apellido (ej: Martín Gómez).' };
    }
  }
  return { valid: true, value };
}

/**
 * Nombre de negocio o sucursal: permite letras, números y puntuación comercial,
 * pero exige al menos 2 letras reales y prohíbe HTML o URLs.
 */
export function validateBusinessName(raw, { min = 2, max = 80, label = 'El nombre del negocio' } = {}) {
  const value = collapseSpaces(raw);
  if (!value) return { valid: false, value: '', error: `Ingresá ${label.toLowerCase()}.` };
  if (value.length < min || value.length > max) {
    return { valid: false, value, error: `${label} debe tener entre ${min} y ${max} caracteres.` };
  }
  if (HTML_TAG_RE.test(value) || /https?:\/\//i.test(value)) {
    return { valid: false, value, error: `${label} no puede incluir enlaces ni código HTML.` };
  }
  if (!BUSINESS_NAME_RE.test(value) || REPEAT_CHAR_RE.test(value)) {
    return { valid: false, value, error: `${label} contiene caracteres no permitidos.` };
  }
  const letterCount = (value.match(/\p{L}/gu) || []).length;
  if (letterCount < 2) {
    return { valid: false, value, error: `${label} debe incluir al menos 2 letras.` };
  }
  return { valid: true, value };
}

export function validateBranchName(raw) {
  return validateBusinessName(raw, { min: 2, max: 60, label: 'El nombre de la sucursal' });
}

/**
 * Normaliza dígitos para WhatsApp (Argentina por defecto cuando el número viene local sin código de país).
 * Ej: "381 555-1234" -> "5493815551234", "0381 15 555-1234" -> "5493815551234", "+54 9 381 555 1234" -> "5493815551234".
 */
export function normalizeWhatsAppDigits(raw) {
  const trimmed = String(raw ?? '').trim();
  let digits = trimmed.replace(/\D/g, '');
  if (!digits) return '';

  // Si empieza con 00 (prefijo internacional), quitar 00
  if (digits.startsWith('00')) digits = digits.slice(2);

  // Si escribió explícitamente "+" y no es Argentina, respetar el código internacional tal cual
  if (trimmed.startsWith('+') && !digits.startsWith('54')) {
    return digits;
  }

  // Argentina: quitar 0 inicial si escribió 0381...
  if (digits.startsWith('0') && digits.length >= 10) {
    digits = digits.slice(1);
  }

  // Quitar "15" local argentino (ej: 381155551234 -> 3815551234; 111555551234 -> 1155551234)
  if (!digits.startsWith('54') && digits.length === 12) {
    if (digits.slice(2, 4) === '15') digits = digits.slice(0, 2) + digits.slice(4);
    else if (digits.slice(3, 5) === '15') digits = digits.slice(0, 3) + digits.slice(5);
    else if (digits.slice(4, 6) === '15') digits = digits.slice(0, 4) + digits.slice(6);
  }

  // Ya tiene 549 + 10 dígitos
  if (digits.startsWith('549') && digits.length === 13) return digits;
  // Tiene 54 + 10 dígitos (le falta el 9 de celular para WhatsApp)
  if (digits.startsWith('54') && digits.length === 12) return `549${digits.slice(2)}`;
  // Número argentino local de 10 dígitos (ej: 3815551234 o 1155551234)
  if (!digits.startsWith('54') && digits.length === 10) return `549${digits}`;

  return digits;
}

/**
 * Teléfono / WhatsApp real: sin letras, 8 a 15 dígitos y rechaza números falsos (00000000, 12345678...).
 */
export function validatePhone(raw, { required = false, label = 'El teléfono' } = {}) {
  const value = String(raw ?? '').trim();
  if (!value) {
    return required
      ? { valid: false, value: '', digits: '', whatsappDigits: '', error: `Ingresá ${label.toLowerCase()}.` }
      : { valid: true, value: '', digits: '', whatsappDigits: '' };
  }
  if (!PHONE_CHARS_RE.test(value)) {
    return {
      valid: false,
      value,
      digits: '',
      whatsappDigits: '',
      error: `${label} solo puede tener números, espacios, +, - o paréntesis (sin letras).`
    };
  }
  const digits = value.replace(/\D/g, '');
  if (digits.length < 8 || digits.length > 15) {
    return {
      valid: false,
      value,
      digits,
      whatsappDigits: '',
      error: `${label} debe tener entre 8 y 15 dígitos (con código de área, ej: +54 9 381 555 1234).`
    };
  }
  // Rechazar números inventados: todos dígitos iguales o secuencia trivial
  if (/^(\d)\1+$/.test(digits) || FAKE_PHONE_SEQUENCES.has(digits)) {
    return {
      valid: false,
      value,
      digits,
      whatsappDigits: '',
      error: `${label} no parece un número real. Revisá los dígitos ingresados.`
    };
  }
  const whatsappDigits = normalizeWhatsAppDigits(value);
  return { valid: true, value, digits, whatsappDigits };
}

/**
 * Checklist en vivo para contraseñas nuevas.
 */
export function getPasswordChecks(password = '') {
  const value = String(password);
  return {
    minLength: value.length >= 8,
    maxLength: value.length <= 72,
    hasLetter: /[a-zA-Z]/.test(value),
    hasNumber: /\d/.test(value),
    noEdgeSpaces: value.length === 0 || value === value.trim()
  };
}

/**
 * Contraseña segura (creación, cambio o restablecimiento):
 * mínimo 8 caracteres, al menos 1 letra y 1 número, sin contraseñas obvias.
 */
export function validatePassword(raw) {
  const value = String(raw ?? '');
  if (!value) return { valid: false, error: 'Ingresá una contraseña.' };
  if (value !== value.trim()) {
    return { valid: false, error: 'La contraseña no puede empezar ni terminar con espacios.' };
  }
  if (value.length < 8 || value.length > 72) {
    return { valid: false, error: 'La contraseña debe tener entre 8 y 72 caracteres.' };
  }
  if (!/[a-zA-Z]/.test(value) || !/\d/.test(value)) {
    return { valid: false, error: 'La contraseña debe incluir al menos una letra y un número.' };
  }
  if (WEAK_PASSWORDS.has(value.toLowerCase()) || /^(.)\1+$/.test(value)) {
    return { valid: false, error: 'Esa contraseña es muy fácil de adivinar. Elegí una más segura.' };
  }
  return { valid: true, value };
}

/**
 * Enlace de reseñas de Google Maps / Google Business Profile:
 * debe ser https:// y pertenecer a un dominio oficial de Google (g.page, maps.app.goo.gl, google.com, etc.).
 */
export function validateGoogleReviewUrl(raw, { required = true } = {}) {
  const value = String(raw ?? '').trim();
  if (!value) {
    return required
      ? { valid: false, value: '', error: 'Pegá el enlace de reseñas de Google (ej: https://g.page/r/.../review).' }
      : { valid: true, value: '' };
  }
  if (/\s/.test(value)) {
    return { valid: false, value, error: 'El enlace de Google no puede tener espacios.' };
  }
  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    return { valid: false, value, error: 'El enlace no es una URL válida. Debe empezar con https://' };
  }
  if (parsed.protocol !== 'https:') {
    return { valid: false, value, error: 'El enlace debe empezar con https:// (conexión segura).' };
  }
  if (!GOOGLE_DOMAIN_RE.test(parsed.hostname)) {
    return {
      valid: false,
      value,
      error: 'Ingresá un enlace oficial de Google (g.page, maps.app.goo.gl, maps.google.com o search.google.com).'
    };
  }
  return { valid: true, value: parsed.toString() };
}

/**
 * Mensaje de rescate (WhatsApp / Email): exige texto real (mín. 5 caracteres y al menos 3 letras)
 * y avisa si quedaron variables de plantilla sin completar ({nombre}, {encargado}, etc.).
 */
export function validateRescueMessage(raw) {
  const value = String(raw ?? '').trim();
  if (!value) {
    return { valid: false, value: '', error: 'Escribí un mensaje antes de abrir el canal de contacto.' };
  }
  if (value.length < 5) {
    return { valid: false, value, error: 'El mensaje es demasiado corto (mínimo 5 caracteres).' };
  }
  if (value.length > 4000) {
    return { valid: false, value, error: 'El mensaje supera el máximo de 4000 caracteres.' };
  }
  const letterCount = (value.match(/\p{L}/gu) || []).length;
  if (letterCount < 3) {
    return { valid: false, value, error: 'El mensaje debe contener texto legible para el cliente.' };
  }
  const unreplaced = value.match(/\{(nombre|encargado|negocio|sucursal|aspectos|estrellas)\}/gi);
  if (unreplaced) {
    return {
      valid: false,
      value,
      error: `Completá o borrá la variable sin reemplazar en el mensaje: ${unreplaced[0]}`
    };
  }
  return { valid: true, value };
}

/**
 * Texto libre de pregunta o placeholder del formulario del ticket.
 */
export function validateSurveyText(raw, { required = true, min = 2, max = 160, label = 'El texto' } = {}) {
  const value = collapseSpaces(raw);
  if (!value) {
    return required ? { valid: false, value: '', error: `Completá ${label.toLowerCase()}.` } : { valid: true, value: '' };
  }
  if (value.length < min || value.length > max) {
    return { valid: false, value, error: `${label} debe tener entre ${min} y ${max} caracteres.` };
  }
  if (HTML_TAG_RE.test(value)) {
    return { valid: false, value, error: `${label} no puede contener etiquetas HTML.` };
  }
  const hasWordChar = /[\p{L}\p{N}]/u.test(value);
  if (!hasWordChar) {
    return { valid: false, value, error: `${label} debe incluir letras o números reales.` };
  }
  return { valid: true, value };
}

export function validateSurveyTag(raw) {
  const value = collapseSpaces(raw);
  if (!value) return { valid: false, value: '', error: 'Escribí el nombre del aspecto.' };
  if (value.length < 2 || value.length > 30) {
    return { valid: false, value, error: 'Cada aspecto debe tener entre 2 y 30 caracteres.' };
  }
  if (HTML_TAG_RE.test(value) || !/\p{L}/u.test(value)) {
    return { valid: false, value, error: 'El aspecto debe contener letras válidas (sin HTML).' };
  }
  return { valid: true, value };
}

export function validateNumberRange(raw, { min = 0, max = 100000000, integer = false, label = 'El valor' } = {}) {
  if (raw === '' || raw === null || raw === undefined) {
    return { valid: false, error: `Ingresá ${label.toLowerCase()}.` };
  }
  const n = Number(raw);
  if (!Number.isFinite(n) || (integer && !Number.isInteger(n))) {
    return { valid: false, error: `${label} debe ser un número ${integer ? 'entero ' : ''}válido.` };
  }
  if (n < min || n > max) {
    return { valid: false, error: `${label} debe estar entre ${min.toLocaleString('es-AR')} y ${max.toLocaleString('es-AR')}.` };
  }
  return { valid: true, value: n };
}
