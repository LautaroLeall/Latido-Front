/**
 * Traduce errores de Supabase (Auth, PostgREST, RPC) a mensajes claros en español.
 * Los errores lanzados por nuestras RPC ya vienen en español y se muestran tal cual.
 */
const AUTH_MESSAGES = [
  [/invalid login credentials/i, 'Email o contraseña incorrectos.'],
  [/email not confirmed/i, 'Todavía no confirmaste tu email. Revisá tu bandeja de entrada.'],
  [/user already registered|already been registered/i, 'Ya existe una cuenta con ese email.'],
  [/password should be at least|weak password/i, 'La contraseña debe tener al menos 8 caracteres.'],
  [/new password should be different/i, 'La nueva contraseña debe ser distinta de la anterior.'],
  [/rate limit|too many requests|security purposes/i, 'Demasiados intentos. Esperá unos minutos y probá de nuevo.'],
  [/unable to validate email|invalid email/i, 'El email no es válido.'],
  [/auth session missing|session.*expired|jwt expired/i, 'Tu sesión expiró. Volvé a ingresar.'],
  [/failed to fetch|networkerror|network request failed/i, 'No hay conexión con el servidor. Revisá tu internet.'],
  [/permission denied/i, 'No tenés permisos para realizar esta acción.'],
  [/row-level security/i, 'No tenés permisos para realizar esta acción.'],
];

// Códigos oficiales de Supabase Auth (más confiables que el texto del mensaje)
const AUTH_CODES = {
  invalid_credentials: 'Email o contraseña incorrectos.',
  email_not_confirmed: 'Todavía no confirmaste tu email. Revisá tu bandeja de entrada (y spam).',
  user_banned: 'Esta cuenta está bloqueada. Contactá al equipo de Latido.',
  over_request_rate_limit: 'Demasiados intentos. Esperá unos minutos y probá de nuevo.',
  over_email_send_rate_limit: 'Se enviaron demasiados emails. Esperá unos minutos y probá de nuevo.',
  user_already_exists: 'Ya existe una cuenta con ese email.',
  email_exists: 'Ya existe una cuenta con ese email.',
  weak_password: 'La contraseña es muy débil: usá al menos 8 caracteres.',
  same_password: 'La nueva contraseña debe ser distinta de la anterior.',
  session_expired: 'Tu sesión expiró. Volvé a ingresar.',
};

export function getErrorMessage(error, fallback = 'Ocurrió un error inesperado. Probá de nuevo.') {
  if (!error) return fallback;
  if (error.code && AUTH_CODES[error.code]) return AUTH_CODES[error.code];
  const message = typeof error === 'string' ? error : error.message || '';

  for (const [pattern, text] of AUTH_MESSAGES) {
    if (pattern.test(message)) return text;
  }

  // Mensajes propios de nuestras RPC / triggers (ya en español)
  if (/[áéíóúñ¿¡]|tenés|necesitás|ingresá|elegí|completá|probá/i.test(message)) {
    return message;
  }

  return fallback;
}
