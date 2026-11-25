import { getErrorMessage } from '../../../lib/errors';

const PASS_UPPER = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const PASS_LOWER = 'abcdefghjkmnpqrstuvwxyz';
const PASS_DIGITS = '23456789';
const PASS_ALL = PASS_UPPER + PASS_LOWER + PASS_DIGITS;

export function generatePassword(length = 12) {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  const chars = [
    PASS_UPPER[bytes[0] % PASS_UPPER.length],
    PASS_LOWER[bytes[1] % PASS_LOWER.length],
    PASS_DIGITS[bytes[2] % PASS_DIGITS.length],
    PASS_DIGITS[bytes[3] % PASS_DIGITS.length]
  ];
  for (let i = 4; i < length; i++) {
    chars.push(PASS_ALL[bytes[i] % PASS_ALL.length]);
  }
  for (let i = chars.length - 1; i > 0; i--) {
    const j = bytes[i] % (i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join('');
}

export async function extractFunctionError(error) {
  if (error?.context && typeof error.context.json === 'function') {
    try {
      const body = await error.context.json();
      if (body?.error) return body.error;
    } catch {
      // Sin cuerpo JSON legible
    }
  }
  if (/failed to send a request to the edge function/i.test(error?.message || '')) {
    return 'No pudimos conectar con la función create-business-account. Verificá que esté desplegada en Supabase.';
  }
  return getErrorMessage(error, 'No pudimos crear la cuenta del negocio.');
}

export function defaultPlanId(plans) {
  return (plans.find(p => p.code === 'base') || plans[0])?.id || '';
}

export function initialForm(plans) {
  return {
    businessName: '',
    branchName: 'Casa central',
    managerName: '',
    planId: defaultPlanId(plans),
    supportsOverride: '1',
    ownerName: '',
    ownerPhone: '',
    email: '',
    password: generatePassword()
  };
}

export function buildHandoffText(c) {
  return [
    `Hola ${c.ownerName.split(/\s+/)[0]}, ¡bienvenido/a a Latido!`,
    `Ya está activa la cuenta de ${c.businessName} (${c.planName} · ${c.supportsLabel}).`,
    '',
    `Ingreso al panel: ${c.loginUrl}`,
    `Email: ${c.email}`,
    `Contraseña inicial: ${c.password}`,
    '',
    `Enlace de tu soporte (${c.branchName}): ${c.ticketUrl}`,
    '',
    'Tu soporte físico QR + NFC ya va configurado y listo para usar. Cuando ingreses al panel podés subir el logo del formulario, personalizar las preguntas, elegir dónde recibir las reseñas (tu panel, Google o ambos) y cambiar tu contraseña desde "Mi cuenta".'
  ].join('\n');
}
