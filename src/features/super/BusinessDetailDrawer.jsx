import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { RotateCw, X } from 'lucide-react';
import BusinessLogo from '../../components/branding/BusinessLogo';
import Stamp from '../../components/ui/Stamp';
import Alert from '../../components/ui/Alert';
import { supabase } from '../../lib/supabaseClient';
import { getErrorMessage } from '../../lib/errors';
import { formatDateTime, formatRelative } from '../../lib/utils';
import { buildGmailUrl } from '../../lib/contact';
import { buildCoachingText, buildSupportInsights } from './detail/diagnosticsHelpers';
import SupportInsightsSection from './detail/SupportInsightsSection';
import PerformanceSection from './detail/PerformanceSection';
import RescueHealthSection from './detail/RescueHealthSection';
import BusinessConfigSection from './detail/BusinessConfigSection';
import BranchesKitsSection from './detail/BranchesKitsSection';
import RecentActivitySection from './detail/RecentActivitySection';

export default function BusinessDetailDrawer({ business, kitsRpcReady = true, onBusinessUpdated, onClose }) {
  const [diag, setDiag] = useState(null);
  const [qrList, setQrList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [migrationMissing, setMigrationMissing] = useState(false);

  const load = useCallback(async (isCancelled = () => false) => {
    if (!business?.business_id) return;
    setLoading(true);
    setError('');
    setMigrationMissing(false);
    try {
      const qrCols = kitsRpcReady
        ? 'id, token, active, nfc_status, delivered_at, kit_notes, branch_id, created_at'
        : 'id, token, active, nfc_status, branch_id, created_at';
      const [rpcRes, qrRes] = await Promise.all([
        supabase.rpc('get_business_diagnostics', { p_business_id: business.business_id }),
        supabase
          .from('qr_codes')
          .select(qrCols)
          .eq('business_id', business.business_id)
          .order('created_at', { ascending: true })
      ]);
      if (isCancelled()) return;
      if (rpcRes.error) {
        if (rpcRes.error.code === 'PGRST202' || /get_business_diagnostics|could not find the function/i.test(rpcRes.error.message || '')) {
          setMigrationMissing(true);
          setDiag(null);
        } else {
          setError(getErrorMessage(rpcRes.error, 'No pudimos cargar el diagnóstico del negocio.'));
        }
      } else {
        setDiag(rpcRes.data || null);
      }
      if (qrRes.error && kitsRpcReady) {
        const fallback = await supabase
          .from('qr_codes')
          .select('id, token, active, nfc_status, branch_id, created_at')
          .eq('business_id', business.business_id)
          .order('created_at', { ascending: true });
        if (!isCancelled()) setQrList(fallback.error ? [] : (fallback.data || []));
      } else {
        setQrList(qrRes.error ? [] : (qrRes.data || []));
      }
    } catch (err) {
      if (!isCancelled()) {
        setError(getErrorMessage(err, 'No pudimos cargar el diagnóstico del negocio.'));
      }
    } finally {
      if (!isCancelled()) setLoading(false);
    }
  }, [business?.business_id, kitsRpcReady]);

  const reloadAll = useCallback(async () => {
    await load();
    await onBusinessUpdated?.();
  }, [load, onBusinessUpdated]);

  useEffect(() => {
    let cancelled = false;
    load(() => cancelled);
    return () => { cancelled = true; };
  }, [load]);

  // Cerrar con Escape y bloquear scroll de fondo mientras está abierto
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  const insights = useMemo(() => (diag ? buildSupportInsights(diag) : []), [diag]);

  const b = diag?.business || business;
  const m = diag?.metrics || null;
  const r = diag?.rescue || null;
  const branches = diag?.branches || [];
  const recent = diag?.recent_activity || [];

  const coachingText = useMemo(
    () => buildCoachingText(b.name, b.owner_name, insights),
    [b.name, b.owner_name, insights]
  );
  const coachingWaHref = `https://wa.me/?text=${encodeURIComponent(coachingText)}`;
  const coachingMailHref = b.owner_email
    ? buildGmailUrl(`Acompañamiento Latido · ${b.name}`, coachingText, b.owner_email)
    : null;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-ink/60 backdrop-blur-[1px] overscroll-contain"
      role="dialog"
      aria-modal="true"
      aria-labelledby="drawer-biz-title"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-[740px] h-[100dvh] bg-paper sm:border-l-2 border-ink flex flex-col overflow-hidden shadow-[-8px_0_0_rgba(26,29,41,0.2)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera fija */}
        <header className="bg-ink text-paper px-4 sm:px-5 pt-[max(1rem,env(safe-area-inset-top))] pb-4 border-b-2 border-ink flex items-start justify-between gap-3 shrink-0">
          <div className="flex items-start gap-3 min-w-0">
            <BusinessLogo name={b.name} logoUrl={b.logo_url} size={44} variant="light" />
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 id="drawer-biz-title" className="font-bold text-lg leading-tight break-words">
                  {b.name}
                </h2>
                <Stamp variant={b.active ? 'teal' : 'red'}>{b.active ? 'Activo' : 'Suspendido'}</Stamp>
              </div>
              <div className="font-mono text-[11px] text-paper/75 mt-1 break-all">
                {b.owner_name || 'Sin nombre'}{b.owner_email ? ` · ${b.owner_email}` : ''}
              </div>
              <div className="font-mono text-[10px] text-paper/55 mt-0.5 flex flex-wrap gap-x-2 gap-y-0.5">
                <span>{b.plan_name || business.plan_name} ({business.qr_active}/{b.supports_limit ?? business.supports_limit} soportes)</span>
                <span>· Alta {formatDateTime(b.created_at)}</span>
                {diag && (
                  <span>
                    · Último ingreso:{' '}
                    <strong className="text-paper/85">
                      {b.owner_last_sign_in_at ? formatRelative(b.owner_last_sign_in_at) : 'Nunca'}
                    </strong>
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => load()}
              disabled={loading}
              aria-label="Actualizar diagnóstico"
              title="Actualizar diagnóstico"
              className="p-2 border border-paper/25 text-paper/80 hover:text-paper hover:bg-paper/10 cursor-pointer disabled:opacity-50"
            >
              <RotateCw size={15} className={loading ? 'animate-spin' : ''} />
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar panel de detalle"
              className="p-2 border border-paper/25 text-paper/80 hover:text-paper hover:bg-paper/10 cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>
        </header>

        {/* Cuerpo desplazable */}
        <div className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] space-y-6 bg-paper-dim/40">
          {error && <Alert variant="error">{error}</Alert>}

          {migrationMissing && (
            <Alert variant="warning" title="Falta aplicar la migración 012 en Supabase">
              Para ver el diagnóstico completo (sucursales, tendencias, Modo Rescate y actividad anonimizada), ejecutá{' '}
              <code className="font-mono bg-paper px-1">012_super_admin_diagnostico.sql</code> en Supabase SQL Editor.
              Mientras tanto te mostramos el resumen base del negocio.
            </Alert>
          )}

          {loading ? (
            <div className="space-y-4">
              <div className="h-28 bg-paper border border-line-gray animate-pulse" />
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[1, 2, 3, 4].map((i) => <div key={i} className="h-20 bg-paper border border-line-gray animate-pulse" />)}
              </div>
              <div className="h-44 bg-paper border border-line-gray animate-pulse" />
            </div>
          ) : (
            <>
              {diag && (
                <SupportInsightsSection
                  insights={insights}
                  coachingWaHref={coachingWaHref}
                  coachingMailHref={coachingMailHref}
                  primaryToken={business.primary_token}
                />
              )}

              <PerformanceSection business={business} metrics={m} />

              <RescueHealthSection business={b} rescue={r} />

              {diag && (
                <BusinessConfigSection
                  business={b}
                  businessId={business.business_id}
                  onReload={reloadAll}
                />
              )}

              <BranchesKitsSection
                branches={branches}
                qrList={qrList}
                business={b}
                kitsRpcReady={kitsRpcReady}
                onReload={reloadAll}
              />

              {diag && <RecentActivitySection recent={recent} />}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
