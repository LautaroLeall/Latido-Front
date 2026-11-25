/**
 * Clasifica cada soporte en su etapa real dentro del taller de Latido:
 * - 'prepare': activo, sin entregar y chip NFC todavía pendiente de grabar
 * - 'ready':   activo, chip NFC grabado/probado, listo para entregar
 * - 'delivered': activo y entregado físicamente al local
 * - 'inactive': QR desactivado o negocio suspendido
 */
export function getKitStage(kit) {
  if (!kit.active || kit.business_active === false) return 'inactive';
  if (kit.delivered_at) return 'delivered';
  if (kit.nfc_status === 'programmed') return 'ready';
  return 'prepare';
}

export const STAGE_META = {
  prepare: {
    label: 'Por preparar (NFC)',
    short: 'Por armar',
    stampVariant: 'amber',
    border: 'border-l-amber',
    step: 1
  },
  ready: {
    label: 'Listos para entregar',
    short: 'NFC listo · entregar',
    stampVariant: 'teal',
    border: 'border-l-ink',
    step: 2
  },
  delivered: {
    label: 'Entregados y activos',
    short: 'Entregado',
    stampVariant: 'teal',
    border: 'border-l-teal',
    step: 3
  },
  inactive: {
    label: 'Pausados / inactivos',
    short: 'Pausado',
    stampVariant: 'red',
    border: 'border-l-alert-red',
    step: 0
  }
};

export function buildReadyWhatsAppText(kit, url) {
  const first = kit.owner_name ? ` ${kit.owner_name.trim().split(/\s+/)[0]}` : '';
  return [
    `Hola${first}, ¡buenas noticias!`,
    `Ya tengo armado y probado el soporte físico QR + NFC de ${kit.business_name} (${kit.branch_name}).`,
    'Viene listo con tu logo, el QR impreso y el chip NFC ya grabado: solo lo apoyás en el local y empezás a recibir opiniones.',
    '',
    `Si querés probarlo ahora desde tu celu: ${url}`,
    '',
    '¿Cuándo coordinamos para entregártelo?'
  ].join('\n');
}
