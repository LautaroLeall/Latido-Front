import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { getErrorMessage } from '../../../lib/errors';
import { buildKitUrl } from '../../../lib/utils';
import { SITE_URL } from '../../../lib/seoConfig';
import { validateBusinessName, validateNumberRange } from '../../../lib/validators';
import { getKitStage } from '../kits/kitStages';

export function buildReminderText(b) {
  const loginUrl = `${SITE_URL}/login`;
  const lines = [
    `Hola${b.owner_name ? ` ${b.owner_name.split(/\s+/)[0]}` : ''}, te comparto tus datos de acceso a Latido para ${b.name}:`,
    '',
    `Ingreso al panel: ${loginUrl}`,
    b.owner_email ? `Email: ${b.owner_email}` : null,
    b.primary_token ? `Tu ticket QR/NFC: ${buildKitUrl(b.primary_token)}` : null,
    '',
    'Si necesitás restablecer tu contraseña, podés hacerlo desde "¿Olvidaste tu contraseña?" en la pantalla de ingreso.'
  ].filter(v => v !== null);
  return lines.join('\n');
}

export function useSuperData() {
  const [rows, setRows] = useState([]);
  const [plans, setPlans] = useState([]);
  const [kits, setKits] = useState([]);
  const [kitsMigrationMissing, setKitsMigrationMissing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [actionError, setActionError] = useState('');

  const load = useCallback(async () => {
    setError(null);
    try {
      const [ov, pl, kt] = await Promise.all([
        supabase.rpc('get_platform_overview'),
        supabase.from('plans').select('*').order('sort_order', { ascending: true }),
        supabase.rpc('super_list_kits')
      ]);
      const err = ov.error || pl.error;
      if (err) {
        setError(err);
      } else {
        const overviewRows = ov.data || [];
        setRows(overviewRows);
        setPlans(pl.data || []);

        if (kt.error) {
          const isMissing = kt.error.code === 'PGRST202' || /super_list_kits|could not find the function/i.test(kt.error.message || '');
          setKitsMigrationMissing(isMissing);
          const { data: rawQrs } = await supabase
            .from('qr_codes')
            .select('id, token, active, nfc_status, created_at, business_id, branch:branches(id, name)')
            .order('created_at', { ascending: false });
          const bizMap = new Map(overviewRows.map(b => [b.business_id, b]));
          setKits((rawQrs || []).map(q => {
            const b = bizMap.get(q.business_id);
            const br = Array.isArray(q.branch) ? q.branch[0] : q.branch;
            return {
              qr_id: q.id,
              token: q.token,
              active: q.active,
              nfc_status: q.nfc_status,
              delivered_at: null,
              kit_notes: null,
              created_at: q.created_at,
              branch_id: br?.id || null,
              branch_name: br?.name || 'Sucursal',
              business_id: q.business_id,
              business_name: b?.name || 'Negocio',
              business_logo_url: b?.logo_url || null,
              business_active: b?.active ?? true,
              review_destination: null,
              owner_name: b?.owner_name || null,
              owner_email: b?.owner_email || null,
              plan_name: b?.plan_name || 'Plan',
              supports_limit: b?.supports_limit || 1,
              responses_total: 0,
              responses_30d: 0,
              last_response_at: null
            };
          }));
        } else {
          setKitsMigrationMissing(false);
          setKits(kt.data || []);
        }
      }
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const updateBusiness = useCallback(async (id, patch) => {
    setBusyId(id);
    setActionError('');
    try {
      const { error: err } = await supabase.from('businesses').update(patch).eq('id', id);
      if (err) throw err;
      await load();
      return true;
    } catch (err) {
      setActionError(getErrorMessage(err, 'No pudimos actualizar el negocio.'));
      return false;
    } finally {
      setBusyId(null);
    }
  }, [load]);

  const changePlan = useCallback((b, planId) => {
    const plan = plans.find(p => p.id === planId);
    updateBusiness(b.business_id, {
      plan_id: planId,
      supports_override: plan?.is_custom ? (b.supports_limit || 1) : null
    });
  }, [plans, updateBusiness]);

  const changeSupports = useCallback((b, value) => {
    const res = validateNumberRange(value, { min: 1, max: 1000, integer: true, label: 'Los soportes' });
    if (!res.valid) {
      setActionError(res.error);
      return;
    }
    updateBusiness(b.business_id, { supports_override: res.value });
  }, [updateBusiness]);

  const renameBusiness = useCallback(async (b, nextName) => {
    const res = validateBusinessName(nextName);
    if (!res.valid) {
      setActionError(res.error);
      return false;
    }
    if (res.value === b.name) return true;
    return updateBusiness(b.business_id, { name: res.value });
  }, [updateBusiness]);

  const totals = useMemo(() => {
    const priceOf = (planId) => Number(plans.find(p => p.id === planId)?.price_monthly || 0);
    return rows.reduce((acc, b) => ({
      active: acc.active + (b.active ? 1 : 0),
      responses30: acc.responses30 + Number(b.responses_30d || 0),
      rescued: acc.rescued + Number(b.rescued || 0),
      qr: acc.qr + Number(b.qr_active || 0),
      mrr: acc.mrr + (b.active && !b.plan_custom ? priceOf(b.plan_id) : 0)
    }), { active: 0, responses30: 0, rescued: 0, qr: 0, mrr: 0 });
  }, [rows, plans]);

  const kitStats = useMemo(() => {
    const byBiz = new Map();
    let pending = 0;
    let delivered = 0;
    for (const k of kits) {
      const st = getKitStage(k);
      if (st === 'prepare' || st === 'ready') {
        pending += 1;
        byBiz.set(k.business_id, (byBiz.get(k.business_id) || 0) + 1);
      } else if (st === 'delivered') {
        delivered += 1;
      }
    }
    return { pending, delivered, byBiz };
  }, [kits]);

  return {
    rows,
    plans,
    kits,
    kitsMigrationMissing,
    loading,
    error,
    busyId,
    actionError,
    totals,
    kitStats,
    load,
    updateBusiness,
    changePlan,
    changeSupports,
    renameBusiness
  };
}
