import React, { useCallback, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Building2, Nfc, PlusCircle, Tags } from 'lucide-react';
import HardButton from '../../components/ui/HardButton';
import Alert from '../../components/ui/Alert';
import { StatCard, EmptyState } from '../admin/components/PanelBits';
import PlansManager from './PlansManager';
import CreateBusinessForm from './CreateBusinessForm';
import BusinessDetailDrawer from './BusinessDetailDrawer';
import KitsManager from './KitsManager';
import { useAuth } from '../../context/AuthContext';
import { getErrorMessage } from '../../lib/errors';
import { formatMoney, normalizeSearch } from '../../lib/utils';
import { useSuperData } from './dashboard/useSuperData';
import SuperShell from './dashboard/SuperShell';
import BusinessCardList from './dashboard/BusinessCardList';

const NAV = [
  {
    id: 'negocios',
    label: 'Negocios',
    subtitle: 'Control global de cuentas, planes, soportes y estado',
    icon: Building2
  },
  {
    id: 'kits',
    label: 'Kits y NFC',
    subtitle: 'Armado de soportes físicos, grabación NTAG213, láminas HD y entregas',
    icon: Nfc
  },
  {
    id: 'alta',
    label: 'Alta de negocio',
    subtitle: 'Creá la cuenta del cliente, prepará su primer soporte y enviá accesos',
    icon: PlusCircle
  },
  {
    id: 'planes',
    label: 'Planes y precios',
    subtitle: 'Editá nombres, soportes y precios internos (la landing muestra solo detalles y modalidad mensual)',
    icon: Tags
  }
];

/**
 * Panel Super Admin — 100% pantalla completa, responsive para celular, tablet, notebook y escritorio.
 * Datos vía get_platform_overview(): solo métricas agregadas + datos del dueño (cliente B2B).
 * El Super Admin NO puede leer comentarios ni contactos de clientes finales (bloqueado por RLS).
 */
export default function SuperDashboard() {
  const { profile, signOut } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentNav = NAV.find(n => n.id === searchParams.get('tab')) || NAV[0];
  const view = currentNav.id;
  const setView = useCallback((id) => {
    setSearchParams(id === 'negocios' ? {} : { tab: id }, { replace: true });
  }, [setSearchParams]);

  const data = useSuperData();
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all | active | suspended
  const [detailBusinessId, setDetailBusinessId] = useState(null);

  const detailBusiness = useMemo(
    () => (detailBusinessId ? data.rows.find(r => r.business_id === detailBusinessId) || null : null),
    [data.rows, detailBusinessId]
  );

  const filtered = useMemo(() => {
    const q = normalizeSearch(query.trim());
    return data.rows.filter(b => {
      if (statusFilter === 'active' && !b.active) return false;
      if (statusFilter === 'suspended' && b.active) return false;
      if (!q) return true;
      return (
        normalizeSearch(b.name).includes(q) ||
        normalizeSearch(b.owner_email).includes(q) ||
        normalizeSearch(b.owner_name).includes(q)
      );
    });
  }, [data.rows, query, statusFilter]);

  function handleToggleActive(b) {
    if (b.active && !window.confirm(`¿Suspender "${b.name}"? Sus QR dejan de funcionar al instante.`)) return;
    data.updateBusiness(b.business_id, { active: !b.active });
  }

  return (
    <SuperShell
      navItems={NAV}
      currentNav={currentNav}
      view={view}
      profileName={profile.full_name}
      rowsCount={data.rows.length}
      pendingKitsCount={data.kitStats.pending}
      loading={data.loading}
      canCreateBusiness={!data.loading && data.plans.length > 0}
      onSelectView={setView}
      onReload={data.load}
      onSignOut={signOut}
    >
      {data.error && <Alert variant="error">{getErrorMessage(data.error, 'No pudimos cargar la plataforma.')}</Alert>}

      {/* KPIs globales */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
        <StatCard label="Negocios activos" value={`${data.totals.active}/${data.rows.length}`} loading={data.loading} />
        <button
          type="button"
          onClick={() => setView('kits')}
          className="w-full h-full min-w-0 text-left cursor-pointer hover:opacity-90 transition-opacity"
          title="Ir al centro de armado y entrega de kits QR + NFC"
        >
          <StatCard
            label="Kits por entregar"
            badge={data.kitStats.pending > 0 ? 'TALLER' : 'AL DÍA'}
            value={data.kitStats.pending}
            tone={data.kitStats.pending > 0 ? 'amber' : 'teal'}
            loading={data.loading}
          />
        </button>
        <StatCard label="MRR estimado" badge="PLANES" value={formatMoney(data.totals.mrr)} tone="teal" loading={data.loading} />
        <StatCard label="Opiniones (30d)" value={data.totals.responses30.toLocaleString('es-AR')} tone="teal" loading={data.loading} />
        <StatCard label="Rescatados" value={data.totals.rescued} tone="teal" loading={data.loading} />
      </div>

      {data.actionError && <Alert variant="error">{data.actionError}</Alert>}

      {view === 'kits' && (
        <KitsManager
          kits={data.kits}
          businesses={data.rows}
          loading={data.loading}
          migrationMissing={data.kitsMigrationMissing}
          onChanged={data.load}
          onOpenBusiness={(bizId) => setDetailBusinessId(bizId)}
          onCreateBusiness={() => setView('alta')}
        />
      )}

      {view === 'alta' && (
        <CreateBusinessForm
          plans={data.plans}
          onCreated={data.load}
          onClose={() => setView('negocios')}
          onOpenKits={() => setView('kits')}
        />
      )}

      {view === 'planes' && <PlansManager plans={data.plans} onChanged={data.load} />}

      {view === 'negocios' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {[
                { id: 'all', label: `Todos (${data.rows.length})` },
                { id: 'active', label: `Activos (${data.totals.active})` },
                { id: 'suspended', label: `Suspendidos (${data.rows.length - data.totals.active})` }
              ].map(f => (
                <HardButton
                  key={f.id}
                  size="sm"
                  variant={statusFilter === f.id ? 'primary' : 'secondary'}
                  onClick={() => setStatusFilter(f.id)}
                >
                  {f.label}
                </HardButton>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <input
                type="search"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Buscar negocio, dueño o email..."
                aria-label="Buscar negocio, dueño o email"
                className="bg-paper text-ink border-[1.5px] border-ink px-3 py-2 min-h-[44px] sm:min-h-[38px] text-base sm:text-sm rounded-none outline-none focus:border-teal flex-1 min-w-0 sm:w-72"
              />
              <HardButton size="sm" variant="teal" className="lg:hidden shrink-0" onClick={() => setView('alta')} disabled={data.loading || data.plans.length === 0}>
                + Nuevo
              </HardButton>
            </div>
          </div>

          {data.loading ? (
            <div className="h-56 bg-paper-dim border border-line-gray animate-pulse" />
          ) : filtered.length === 0 ? (
            <EmptyState title={data.rows.length ? 'Sin resultados para ese filtro' : 'Todavía no hay negocios dados de alta'}>
              {!data.rows.length && (
                <div className="mt-3">
                  <HardButton size="sm" variant="teal" onClick={() => setView('alta')}>
                    + Crear primer negocio
                  </HardButton>
                </div>
              )}
            </EmptyState>
          ) : (
            <BusinessCardList
              businesses={filtered}
              plans={data.plans}
              busyId={data.busyId}
              kitsByBiz={data.kitStats.byBiz}
              onChangePlan={data.changePlan}
              onChangeSupports={data.changeSupports}
              onRenameBusiness={data.renameBusiness}
              onToggleActive={handleToggleActive}
              onOpenDetail={setDetailBusinessId}
              onOpenKits={() => setView('kits')}
            />
          )}
        </div>
      )}

      <p className="font-mono text-xs text-muted p-3 border border-line-gray bg-paper-dim">
        <strong>Aislamiento y Ley 25.326:</strong> el rol Super Admin administra cuentas de negocios, diagnósticos de salud y actividad anonimizada,
        pero no tiene acceso a comentarios ni datos personales de clientes finales (bloqueado en la base de datos).
      </p>

      {detailBusiness && (
        <BusinessDetailDrawer
          business={detailBusiness}
          kitsRpcReady={!data.kitsMigrationMissing}
          onBusinessUpdated={data.load}
          onClose={() => setDetailBusinessId(null)}
        />
      )}
    </SuperShell>
  );
}
