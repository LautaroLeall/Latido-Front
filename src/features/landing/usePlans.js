import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

/**
 * Planes de reserva: se muestran si Supabase no responde, no está configurado
 * o todavía no se aplicó la migración 007. Los valores reales los edita el
 * Super Admin y se leen de la tabla `plans`.
 */
export const FALLBACK_PLANS = [
  { id: 'f-base', code: 'base', name: 'Plan Base', supports: 1, price_monthly: 50000, currency: 'ARS', is_custom: false, highlighted: false },
  { id: 'f-plus', code: 'plus', name: 'Plan Plus', supports: 3, price_monthly: 100000, currency: 'ARS', is_custom: false, highlighted: true },
  { id: 'f-premium', code: 'premium', name: 'Plan Premium', supports: 5, price_monthly: 175000, currency: 'ARS', is_custom: false, highlighted: false },
  { id: 'f-custom', code: 'custom', name: 'Plan Personalizado', supports: null, price_monthly: null, currency: 'ARS', is_custom: true, highlighted: false }
];

/** Planes activos y públicos, ordenados como los definió el Super Admin */
export default function usePlans() {
  const [plans, setPlans] = useState(FALLBACK_PLANS);
  const [fromDb, setFromDb] = useState(false);

  useEffect(() => {
    if (!supabase) return undefined;
    let cancelled = false;

    supabase
      .from('plans')
      .select('id, code, name, supports, price_monthly, currency, is_custom, highlighted')
      .eq('active', true)
      .order('sort_order', { ascending: true })
      .then(({ data, error }) => {
        if (cancelled || error || !data?.length) return;
        setPlans(data);
        setFromDb(true);
      });

    return () => { cancelled = true; };
  }, []);

  return { plans, fromDb };
}

export function formatPlanPrice(plan) {
  if (plan.is_custom || plan.price_monthly == null) return null;
  const value = Math.round(Number(plan.price_monthly)).toLocaleString('es-AR');
  return plan.currency === 'ARS' ? `$ ${value}` : `${plan.currency} ${value}`;
}
