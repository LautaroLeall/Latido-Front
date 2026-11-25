export const DEST_LABELS = {
  panel: { label: 'Solo panel (Latido)', variant: 'ink' },
  google: { label: 'Solo Google (directo)', variant: 'amber' },
  both: { label: 'Ambas (Latido → Google)', variant: 'teal' }
};

export const RESCUE_STATUS_LABELS = {
  open: { label: 'Rescate abierto', variant: 'red' },
  contacted: { label: 'Contactado', variant: 'amber' },
  resolved: { label: 'Resuelto', variant: 'teal' },
  dismissed: { label: 'Descartado', variant: 'ink' }
};

export function daysSince(iso) {
  if (!iso) return null;
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
}

/**
 * Construye recomendaciones concretas para que el Super Admin ayude a este negocio.
 */
export function buildSupportInsights(diag) {
  const b = diag.business || {};
  const m = diag.metrics || {};
  const r = diag.rescue || {};
  const branches = diag.branches || [];
  const items = [];

  if (!b.active) {
    items.push({
      level: 'urgent',
      title: 'Cuenta suspendida',
      detail: 'Sus QR y chips NFC están pausados. Consultá si quieren reactivar el servicio.',
      tip: 'si quieren reactivar los soportes QR + NFC de tu local'
    });
  }

  if (Number(r.cases_overdue || 0) > 0) {
    const n = Number(r.cases_overdue);
    items.push({
      level: 'urgent',
      title: `${n} ${n === 1 ? 'caso con SLA vencido' : 'casos con SLA vencido'}`,
      detail: 'Hay clientes insatisfechos esperando respuesta en Modo Rescate.',
      tip: `tenés ${n} ${n === 1 ? 'caso' : 'casos'} pendiente${n === 1 ? '' : 's'} en Modo Rescate esperando respuesta`
    });
  }

  const loginDays = daysSince(b.owner_last_sign_in_at);
  if (!b.owner_last_sign_in_at) {
    items.push({
      level: 'warn',
      title: 'El dueño todavía nunca inició sesión',
      detail: 'Conviene acompañar el primer ingreso para dejar todo listo en 5 minutos.',
      tip: 'todavía no ingresaste al panel, si querés hacemos juntos el primer acceso en 5 minutos'
    });
  } else if (loginDays >= 14) {
    items.push({
      level: 'warn',
      title: `Hace ${loginDays} días que no entra al panel`,
      detail: 'Puede estar perdiéndose métricas u opiniones recientes.',
      tip: 'hace un par de semanas que no ingresás al panel y tenés métricas para revisar'
    });
  }

  const resp7 = Number(m.responses_7d || 0);
  const respTotal = Number(m.responses_total || 0);
  if (b.active && respTotal === 0) {
    items.push({
      level: 'warn',
      title: 'Todavía no recibió ninguna opinión',
      detail: 'Verificá si ya colocaron el soporte QR/NFC en un lugar visible del mostrador o caja.',
      tip: 'vi que todavía no entraron opiniones: podemos revisar juntos dónde ubicar el soporte QR/NFC para que los clientes lo escaneen más'
    });
  } else if (b.active && resp7 === 0) {
    items.push({
      level: 'warn',
      title: '0 opiniones en los últimos 7 días',
      detail: 'Revisá si el soporte físico sigue visible o si el equipo lo está mencionando al cobrar.',
      tip: 'esta semana no entraron opiniones nuevas: ¿el soporte QR/NFC sigue visible en el mostrador?'
    });
  }

  if (!b.logo_url) {
    items.push({
      level: 'info',
      title: 'Sin logo cargado',
      detail: 'Está usando monograma de iniciales. Subir el logo mejora la confianza en el ticket digital y la lámina HD.',
      tip: 'podés subir el logo de tu negocio desde "Mi cuenta" para que aparezca en el formulario digital y en tu panel'
    });
  }

  if (b.review_destination === 'panel' || !b.has_google_url) {
    items.push({
      level: 'info',
      title: 'Sin reseñas de Google activas',
      detail: 'Podés ayudarlos a copiar su link de Google Maps y activar el modo "Ambas" para sumar reseñas.',
      tip: 'si querés configuramos tu enlace de Google Maps en modo "Ambas" para sumar reseñas públicas después de cada opinión'
    });
  }

  const nfcPending = branches.reduce((acc, br) => acc + Number(br.nfc_pending || 0), 0);
  if (nfcPending > 0) {
    items.push({
      level: 'info',
      title: `${nfcPending} ${nfcPending === 1 ? 'soporte NFC pendiente' : 'soportes NFC pendientes'} de marcar`,
      detail: 'Uso interno Latido: asegurate de grabar la URL del soporte en el chip NTAG213 antes de entregar el kit físico.',
      tip: null
    });
  }

  if (b.rescue_enabled && Number(b.avg_ticket_value || 0) <= 0) {
    items.push({
      level: 'info',
      title: 'Ticket promedio en $0',
      detail: 'Cargar el ticket promedio les permite ver las ventas estimadas recuperadas en Modo Rescate.',
      tip: 'en Modo Rescate → Ajustes podés cargar tu ticket promedio para medir cuánta facturación estimada recuperás cada mes'
    });
  }

  if (!b.has_custom_survey) {
    items.push({
      level: 'info',
      title: 'Usa preguntas predeterminadas',
      detail: 'Podés sugerirles elegir una plantilla de su rubro en Mi cuenta → Preguntas del formulario.',
      tip: 'en "Mi cuenta → Preguntas del formulario" tenés plantillas rápidas por rubro para personalizar los aspectos que eligen tus clientes'
    });
  }

  return items;
}

export function buildCoachingText(businessName, ownerName, insights) {
  const first = ownerName ? ownerName.trim().split(/\s+/)[0] : '';
  const tips = insights
    .filter((i) => i.tip)
    .slice(0, 3)
    .map((i) => `- ${i.tip.charAt(0).toUpperCase()}${i.tip.slice(1)}.`);
  if (tips.length === 0) {
    return `Hola${first ? ` ${first}` : ''}, ¿cómo venís con Latido en ${businessName}? Vi que el panel viene muy bien encaminado. Cualquier cosa que necesites para aprovecharlo más, avisame.`;
  }
  return [
    `Hola${first ? ` ${first}` : ''}, ¿cómo venís con Latido en ${businessName}?`,
    'Estuve revisando cómo viene tu cuenta para darte una mano:',
    '',
    ...tips,
    '',
    'Si querés lo vemos juntos en 5 minutos.'
  ].join('\n');
}
