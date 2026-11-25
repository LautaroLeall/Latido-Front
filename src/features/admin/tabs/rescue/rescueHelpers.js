/**
 * Formatea una duración legible entre dos timestamps ISO (ej: "14 min", "2 h 10 min").
 */
export function formatDurationBetween(startIso, endIso) {
  if (!startIso || !endIso) return null;
  const start = new Date(startIso).getTime();
  const end = new Date(endIso).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end)) return null;
  const totalMin = Math.max(0, Math.round((end - start) / 60000));
  if (totalMin < 1) return '< 1 min';
  if (totalMin < 60) return `${totalMin} min`;
  const hours = Math.floor(totalMin / 60);
  const mins = totalMin % 60;
  if (hours < 24) return mins > 0 ? `${hours} h ${mins} min` : `${hours} h`;
  const days = Math.floor(hours / 24);
  const remH = hours % 24;
  return remH > 0 ? `${days} ${days === 1 ? 'día' : 'días'} ${remH} h` : `${days} ${days === 1 ? 'día' : 'días'}`;
}

export function getDefaultResolutionSummary(item) {
  if (item.status === 'dismissed') {
    return 'Caso descartado por el equipo; no impacta en las métricas ni en la tasa de rescate.';
  }
  if (item.outcome === 'recovered') {
    return 'Cliente marcado como rescatado sin nota interna adicional.';
  }
  if (item.outcome === 'no_response') {
    return 'Se realizó el seguimiento, pero el cliente no respondió al contacto.';
  }
  if (item.outcome === 'declined') {
    return 'Se contactó al cliente, quien indicó que no deseaba compensación.';
  }
  return 'Caso cerrado sin detalle adicional.';
}

export const HISTORY_FILTERS = [
  { id: 'all', label: 'Todos' },
  { id: 'recovered', label: 'Rescatados' },
  { id: 'no_response', label: 'Sin respuesta' },
  { id: 'declined', label: 'No quiso compensación' },
  { id: 'dismissed', label: 'Descartados' }
];
