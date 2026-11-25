import { useEffect, useState } from 'react';
import { fetchPublicTable, isPublicRpcConfigured } from '../../lib/publicRpc';

/**
 * Planes de reserva: se muestran si Supabase no responde, no está configurado
 * o todavía no se aplicó la migración 007. Los valores reales los edita el
 * Super Admin y se leen de la tabla `plans`.
 */
export const FALLBACK_PLANS = [
  {
    id: 'f-base',
    code: 'base',
    name: 'Plan Base',
    supports: 1,
    is_custom: false,
    highlighted: false
  },
  {
    id: 'f-plus',
    code: 'plus',
    name: 'Plan Plus',
    supports: 3,
    is_custom: false,
    highlighted: true
  },
  {
    id: 'f-premium',
    code: 'premium',
    name: 'Plan Premium',
    supports: 5,
    is_custom: false,
    highlighted: false
  },
  {
    id: 'f-custom',
    code: 'custom',
    name: 'Plan Personalizado',
    supports: null,
    is_custom: true,
    highlighted: false
  }
];

const PLANS_QUERY =
  'select=id,code,name,supports,is_custom,highlighted&active=eq.true&order=sort_order.asc';

/** Planes activos y públicos, ordenados como los definió el Super Admin */
export default function usePlans() {
  const [plans, setPlans] = useState(FALLBACK_PLANS);
  const [fromDb, setFromDb] = useState(false);

  useEffect(() => {
    if (!isPublicRpcConfigured) return undefined;
    const ctrl = new AbortController();

    fetchPublicTable('plans', PLANS_QUERY, { signal: ctrl.signal, timeoutMs: 8000 })
      .then(({ data, error }) => {
        if (ctrl.signal.aborted || error || !Array.isArray(data) || !data.length) return;
        setPlans(data);
        setFromDb(true);
      })
      .catch(() => {
        // Mantiene FALLBACK_PLANS sin interrumpir la landing
      });

    return () => ctrl.abort();
  }, []);

  return { plans, fromDb };
}
