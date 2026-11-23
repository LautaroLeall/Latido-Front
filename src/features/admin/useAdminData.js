import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

/*
 * Hooks de datos del Panel del Negocio.
 * - La seguridad la garantiza RLS: aunque se pida otra cosa, cada negocio recibe solo lo suyo.
 * - Igual filtramos por business_id explícito → usa los índices y es defensa en profundidad.
 * - Los embeds usan el nombre de la FK (!fk) porque hay relaciones múltiples entre tablas.
 */

const PAGE_SIZE = 20;

const RESPONSE_SELECT = `
  id, stars, tags, comment, created_at,
  branch:branches!responses_branch_id_fkey(name),
  contact:response_contacts!response_contacts_response_id_fkey(full_name, preferred_channel, status)
`;

const CASE_SELECT = `
  id, status, stars_snapshot, created_at, sla_due_at, first_contacted_at, contact_channel,
  message_sent, outcome, resolved_at, recovered_value, avg_ticket_snapshot, resolution_note,
  response:responses!rescue_cases_response_id_fkey(comment, tags, created_at, branch:branches!responses_branch_id_fkey(name)),
  contact:response_contacts!rescue_cases_contact_id_fkey(id, full_name, email, phone, preferred_channel)
`;

// PostgREST puede devolver un embed 1:1 como objeto o como array según la versión
const one = (v) => (Array.isArray(v) ? v[0] ?? null : v ?? null);

/**
 * Suscripción Realtime a cambios del negocio. Agrupa ráfagas de eventos (debounce)
 * para no recargar 20 veces si entran 20 opiniones seguidas.
 */
export function useBusinessRealtime(businessId, onChange) {
  const callbackRef = useRef(onChange);
  callbackRef.current = onChange;
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!supabase || !businessId) return undefined;
    let timer = null;
    const fire = (table) => {
      clearTimeout(timer);
      timer = setTimeout(() => callbackRef.current?.(table), 400);
    };

    const channel = supabase
      .channel(`latido-negocio-${businessId}`)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'responses', filter: `business_id=eq.${businessId}` },
        () => fire('responses'))
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'rescue_cases', filter: `business_id=eq.${businessId}` },
        () => fire('rescue_cases'))
      .subscribe((status) => setConnected(status === 'SUBSCRIBED'));

    return () => {
      clearTimeout(timer);
      setConnected(false);
      supabase.removeChannel(channel);
    };
  }, [businessId]);

  return connected;
}

/**
 * Métricas agregadas del período (calculadas en la BD)
 */
export function useBusinessStats(businessId, days, refreshKey) {
  const [state, setState] = useState({ data: null, loading: true, error: null });

  useEffect(() => {
    if (!businessId) return undefined;
    let cancelled = false;
    setState(s => ({ ...s, loading: true, error: null }));

    supabase
      .rpc('get_business_stats', { p_days: days })
      .then(({ data, error }) => {
        if (cancelled) return;
        setState({ data: error ? null : data, loading: false, error });
      })
      .catch((error) => {
        if (cancelled) return;
        setState({ data: null, loading: false, error });
      });

    return () => { cancelled = true; };
  }, [businessId, days, refreshKey]);

  return state;
}

/**
 * Opiniones recientes con paginación "cargar más"
 */
export function useRecentResponses(businessId, refreshKey) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState(null);

  const fetchPage = useCallback(async (from) => {
    const { data, error: err } = await supabase
      .from('responses')
      .select(RESPONSE_SELECT)
      .eq('business_id', businessId)
      .order('created_at', { ascending: false })
      .range(from, from + PAGE_SIZE - 1);
    if (err) throw err;
    return (data || []).map(r => ({ ...r, branch: one(r.branch), contact: one(r.contact) }));
  }, [businessId]);

  useEffect(() => {
    if (!businessId) return undefined;
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchPage(0)
      .then(rows => {
        if (cancelled) return;
        setItems(rows);
        setHasMore(rows.length === PAGE_SIZE);
      })
      .catch(err => !cancelled && setError(err))
      .finally(() => !cancelled && setLoading(false));

    return () => { cancelled = true; };
  }, [businessId, refreshKey, fetchPage]);

  const loadMore = useCallback(async () => {
    if (loadingMore) return;
    setLoadingMore(true);
    try {
      const rows = await fetchPage(items.length);
      setItems(prev => {
        const seen = new Set(prev.map(r => r.id));
        return [...prev, ...rows.filter(r => !seen.has(r.id))];
      });
      setHasMore(rows.length === PAGE_SIZE);
    } catch (err) {
      setError(err);
    } finally {
      setLoadingMore(false);
    }
  }, [fetchPage, items.length, loadingMore]);

  return { items, loading, loadingMore, hasMore, error, loadMore };
}

/**
 * Casos de rescate (activos + historial reciente) y métricas acumuladas
 */
export function useRescueCases(businessId, refreshKey) {
  const [state, setState] = useState({
    active: [], history: [], metrics: null, loading: true, error: null
  });

  const reqRef = useRef(0);

  const load = useCallback(async () => {
    if (!businessId) return;
    const reqId = ++reqRef.current;
    try {
      const [activeRes, historyRes, metricsRes] = await Promise.all([
        supabase.from('rescue_cases').select(CASE_SELECT)
          .eq('business_id', businessId)
          .in('status', ['open', 'contacted'])
          .order('sla_due_at', { ascending: true })
          .limit(100),
        supabase.from('rescue_cases').select(CASE_SELECT)
          .eq('business_id', businessId)
          .in('status', ['resolved', 'dismissed'])
          .order('created_at', { ascending: false })
          .limit(50),
        supabase.from('rescue_metrics').select('*').eq('business_id', businessId)
      ]);

      if (reqId !== reqRef.current) return;
      const firstError = activeRes.error || historyRes.error || metricsRes.error;
      if (firstError) throw firstError;

      const normalize = (rows) => (rows || []).map(c => {
        const response = one(c.response);
        return {
          ...c,
          response: response ? { ...response, branch: one(response.branch) } : null,
          contact: one(c.contact)
        };
      });

      const totals = (metricsRes.data || []).reduce((acc, m) => ({
        closed: acc.closed + Number(m.cases_closed || 0),
        recovered: acc.recovered + Number(m.recovered || 0),
        recoveredValue: acc.recoveredValue + Number(m.recovered_value || 0),
        withinSla: acc.withinSla + Number(m.within_sla || 0),
        total: acc.total + Number(m.cases_total || 0)
      }), { closed: 0, recovered: 0, recoveredValue: 0, withinSla: 0, total: 0 });

      setState({
        active: normalize(activeRes.data),
        history: normalize(historyRes.data),
        metrics: {
          ...totals,
          rescueRate: totals.closed ? Math.round((totals.recovered / totals.closed) * 100) : 0
        },
        loading: false,
        error: null
      });
    } catch (err) {
      if (reqId !== reqRef.current) return;
      console.error('[LATIDO] Error cargando casos de rescate:', err);
      setState(s => ({ ...s, loading: false, error: err }));
    }
  }, [businessId]);

  useEffect(() => {
    load();
    return () => { reqRef.current += 1; };
  }, [load, refreshKey]);

  return { ...state, reload: load };
}

/**
 * Plantillas de rescate: las propias del negocio pisan a las globales
 */
export function useRescueTemplates(businessId) {
  const [templates, setTemplates] = useState([]);

  useEffect(() => {
    if (!businessId) return undefined;
    let cancelled = false;
    supabase
      .from('rescue_templates')
      .select('id, business_id, stars, channel, subject, body')
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          console.error('[LATIDO] Error cargando plantillas:', error);
          return;
        }
        setTemplates(data || []);
      })
      .catch((err) => {
        if (!cancelled) console.error('[LATIDO] Error cargando plantillas:', err);
      });
    return () => { cancelled = true; };
  }, [businessId]);

  const getTemplate = useCallback((stars, channel) => {
    const ch = channel === 'email' ? 'email' : 'whatsapp';
    const st = Math.min(Math.max(stars, 1), 3);
    const candidates = templates.filter(t => t.stars === st && t.channel === ch);
    return candidates.find(t => t.business_id) || candidates.find(t => !t.business_id) || null;
  }, [templates]);

  return { templates, getTemplate };
}

/**
 * QRs y sucursales del negocio
 */
export function useQrCodes(businessId, refreshKey) {
  const [state, setState] = useState({ items: [], loading: true, error: null });

  useEffect(() => {
    if (!businessId) return undefined;
    let cancelled = false;
    setState(s => ({ ...s, loading: true, error: null }));

    supabase
      .from('qr_codes')
      .select('id, token, active, nfc_status, created_at, branch:branches(id, name)')
      .eq('business_id', businessId)
      .order('created_at', { ascending: true })
      .then(({ data, error }) => {
        if (cancelled) return;
        setState({
          items: (data || []).map(q => ({ ...q, branch: one(q.branch) })),
          loading: false,
          error
        });
      })
      .catch((error) => {
        if (cancelled) return;
        setState(s => ({ ...s, loading: false, error }));
      });

    return () => { cancelled = true; };
  }, [businessId, refreshKey]);

  return state;
}
