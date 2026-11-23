import React, { memo, useCallback, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  BarChart3, QrCode, LifeBuoy, ExternalLink, UserCog, LogOut, Menu, X, ImagePlus
} from 'lucide-react';
import BusinessLogo from '../../components/branding/BusinessLogo';
import LatidoLogo from '../../components/branding/LatidoLogo';
import LatidoSymbol from '../../components/branding/LatidoSymbol';
import HardButton from '../../components/ui/HardButton';
import { useAuth } from '../../context/AuthContext';
import useNow from '../../hooks/useNow';
import { usePageMeta } from '../../lib/seo';
import { useBusinessRealtime, useRescueCases, useRescueTemplates } from './useAdminData';
import ResultsTab from './tabs/ResultsTab';
import QrTabBase from './tabs/QrTab';
import DestinationTabBase from './tabs/DestinationTab';
import RescueTab from './tabs/RescueTab';
import AccountTabBase from './tabs/AccountTab';

// Evita que el tick de 30s del reloj SLA re-renderice pestañas que no dependen del reloj
const QrTab = memo(QrTabBase);
const DestinationTab = memo(DestinationTabBase);
const AccountTab = memo(AccountTabBase);

const TABS = [
  { id: 'resultados', label: 'Resultados', subtitle: 'Métricas y opiniones recientes en tiempo real', icon: BarChart3 },
  { id: 'qrs', label: 'Mis QR & NFC', subtitle: 'Sucursales, láminas descargables y soportes activos', icon: QrCode },
  { id: 'rescate', label: 'Modo Rescate', subtitle: 'Recuperá clientes insatisfechos antes de perderlos', icon: LifeBuoy },
  { id: 'destino', label: 'Destino de reseñas', subtitle: 'Elegí qué ve el cliente al terminar de opinar', icon: ExternalLink },
  { id: 'cuenta', label: 'Mi cuenta', subtitle: 'Plan, soportes activos, formulario del ticket y contraseña', icon: UserCog }
];

/**
 * Panel del Negocio (100% ancho de pantalla, responsive para celular, tablet, notebook y escritorio).
 * Co-branding: el negocio es protagonista, Latido firma.
 * Todos los datos pasan por RLS: este componente nunca puede ver otro negocio.
 */
export default function AdminDashboard() {
  const { profile, business, businessMonogram, isAdmin, signOut, refreshProfile } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = TABS.find(t => t.id === searchParams.get('tab')) || TABS[0];
  const activeTab = currentTab.id;

  const [menuOpen, setMenuOpen] = useState(false);
  const logoPromptKey = `latido_logo_prompt_dismissed_${business.id}`;
  const [logoPromptDismissed, setLogoPromptDismissed] = useState(() => {
    try {
      return sessionStorage.getItem(logoPromptKey) === '1';
    } catch {
      return false;
    }
  });
  const [refreshKey, setRefreshKey] = useState(0);
  const now = useNow(30000);

  const rescue = useRescueCases(business.id, refreshKey);
  const { getTemplate } = useRescueTemplates(business.id);

  // Realtime: nuevas opiniones / cambios en casos → refrescar
  const handleRealtime = useCallback(() => setRefreshKey(k => k + 1), []);
  const live = useBusinessRealtime(business.id, handleRealtime);

  const overdueCount = rescue.active.filter(c => c.status === 'open' && new Date(c.sla_due_at).getTime() <= now).length;

  usePageMeta({ title: `${business.name} · Panel Latido`, noindex: true });

  const selectTab = useCallback((id) => {
    setMenuOpen(false);
    setSearchParams(id === 'resultados' ? {} : { tab: id }, { replace: true });
  }, [setSearchParams]);

  const openDestination = useCallback(() => selectTab('destino'), [selectTab]);
  const openAccount = useCallback(() => selectTab('cuenta'), [selectTab]);

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-paper-dim">
      {/* ── Sidebar Escritorio / Notebook (lg+) ────────────────────────────── */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 xl:w-72 shrink-0 bg-ink text-paper sticky top-0 h-screen border-r-2 border-ink">
        {/* Identidad del negocio */}
        <div className="p-5 border-b border-paper/15">
          <div className="flex items-center gap-3 min-w-0">
            <BusinessLogo name={business.name} logoUrl={business.logo_url} size={44} variant="light" />
            <div className="min-w-0">
              <div className="font-bold text-lg leading-tight tracking-tight truncate">{business.name}</div>
              <div className="mt-1">
                <span className="inline-block bg-amber text-ink font-mono font-bold text-[10px] px-1.5 py-0.5 tracking-wider uppercase">
                  {business.plan?.name || 'Plan'}
                </span>
              </div>
            </div>
          </div>
          <div className="font-mono text-[#A3A8B3] text-[11px] tracking-wider mt-3 uppercase truncate">
            {isAdmin ? 'Admin' : 'Equipo'} · {profile.full_name}
          </div>
        </div>

        {/* Navegación vertical */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto" aria-label="Secciones del panel">
          {TABS.map(tab => {
            const Icon = tab.icon;
            const badge = tab.id === 'rescate' ? rescue.active.length : 0;
            const selected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => selectTab(tab.id)}
                aria-current={selected ? 'page' : undefined}
                className={`w-full flex items-center justify-between gap-2 px-3.5 py-3 text-left font-mono text-xs uppercase tracking-wider cursor-pointer transition-colors border-l-[3px] ${selected
                  ? 'bg-paper/10 text-paper font-bold border-l-amber'
                  : 'text-paper/70 hover:text-paper hover:bg-paper/5 border-l-transparent'
                  }`}
              >
                <span className="flex items-center gap-2.5 min-w-0">
                  <Icon size={16} className={selected ? 'text-amber shrink-0' : 'text-paper/60 shrink-0'} />
                  <span className="truncate">{tab.label}</span>
                </span>
                {badge > 0 && (
                  <span className={`text-paper font-mono text-[10px] font-bold px-1.5 py-0.5 shrink-0 ${overdueCount ? 'bg-alert-red animate-pulse' : 'bg-alert-red'}`}>
                    {badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Pie del sidebar: estado en vivo + salir + firma Latido */}
        <div className="p-4 border-t border-paper/15 space-y-3">
          <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-paper/70">
            <span className={`inline-block w-2 h-2 shrink-0 ${live ? 'bg-[#4DB3A1]' : 'bg-paper/30'}`} />
            <span className="truncate">{live ? 'En vivo · tiempo real' : 'Conectando...'}</span>
          </div>

          <div className="flex items-center justify-between gap-2 pt-2 border-t border-paper/10">
            <LatidoLogo variant="dark" fontSize={15} symWidth={26} />
            <button
              type="button"
              onClick={signOut}
              className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-[#A3A8B3] hover:text-paper cursor-pointer"
            >
              <LogOut size={13} /> Salir
            </button>
          </div>
        </div>
      </aside>

      {/* ── Header Móvil y Tablet (<lg) ────────────────────────────────────── */}
      <header className="lg:hidden bg-ink text-paper sticky top-0 z-40 border-b border-ink">
        <div className="px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <BusinessLogo name={business.name} logoUrl={business.logo_url} size={36} variant="light" />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-bold text-base tracking-tight truncate">{business.name}</span>
                <span className="bg-amber text-ink font-mono font-bold text-[9.5px] px-1.5 py-0.5 uppercase shrink-0">
                  {business.plan?.name || 'Plan'}
                </span>
              </div>
              <div className="font-mono text-[10px] text-[#A3A8B3] truncate">
                {profile.full_name}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setMenuOpen(v => !v)}
            aria-expanded={menuOpen}
            aria-label="Menú de cuenta"
            className="p-2 border border-paper/25 text-paper cursor-pointer shrink-0"
          >
            {menuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>

        {/* Menú desplegable en celular/tablet */}
        {menuOpen && (
          <div className="px-4 pb-4 pt-2 border-t border-paper/15 bg-ink space-y-3 animate-fadeIn">
            <div className="flex items-center justify-between font-mono text-[11px] text-paper/75">
              <span className="flex items-center gap-1.5">
                <span className={`inline-block w-2 h-2 ${live ? 'bg-[#4DB3A1]' : 'bg-paper/30'}`} />
                {live ? 'EN VIVO' : 'CONECTANDO...'}
              </span>
              <LatidoLogo variant="dark" fontSize={14} symWidth={24} />
            </div>
            <button
              type="button"
              onClick={signOut}
              className="w-full py-2.5 px-3 border border-paper/30 font-mono text-xs uppercase tracking-wider text-paper flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogOut size={14} /> Cerrar sesión
            </button>
          </div>
        )}

        {/* Barra de pestañas rápida (1 toque en celular y tablet) */}
        <nav className="bg-paper-dim text-ink border-b-[1.5px] border-line-gray px-2 sm:px-4 flex gap-1 overflow-x-auto" role="tablist">
          {TABS.map(tab => {
            const Icon = tab.icon;
            const badge = tab.id === 'rescate' ? rescue.active.length : 0;
            const selected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => selectTab(tab.id)}
                className={`py-3 px-3 border-b-2 font-mono font-bold text-[11px] uppercase tracking-wider flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-colors ${selected ? 'border-teal text-ink' : 'border-transparent text-muted hover:text-ink'
                  }`}
              >
                <Icon size={14} className={selected ? 'text-teal' : 'text-muted'} />
                <span>{tab.label}</span>
                {badge > 0 && (
                  <span className={`text-paper font-mono text-[10px] font-bold px-1.5 ${overdueCount ? 'bg-alert-red animate-pulse' : 'bg-alert-red'}`}>
                    {badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </header>

      {/* ── Contenido principal (100% del ancho disponible) ────────────────── */}
      <div className="flex-1 min-w-0 flex flex-col bg-paper">
        {/* Barra superior de sección en escritorio/notebook */}
        <div className="hidden lg:flex items-center justify-between gap-4 px-8 py-4 border-b border-line-gray bg-paper-dim/50">
          <div className="min-w-0">
            <h1 className="text-xl font-bold tracking-tight">{currentTab.label}</h1>
            <p className="font-mono text-xs text-muted mt-0.5">{currentTab.subtitle}</p>
          </div>
          <div className="flex items-center gap-3 shrink-0 font-mono text-xs">
            {overdueCount > 0 && (
              <button
                type="button"
                onClick={() => selectTab('rescate')}
                className="bg-alert-red text-paper font-bold px-2.5 py-1 uppercase tracking-wider cursor-pointer animate-pulse"
              >
                {overdueCount} SLA vencido{overdueCount > 1 ? 's' : ''}
              </button>
            )}
            <span className="inline-flex items-center gap-1.5 text-muted">
              <span className={`inline-block w-2 h-2 ${live ? 'bg-teal' : 'bg-line-gray'}`} />
              {live ? 'EN VIVO' : 'CONECTANDO...'}
            </span>
          </div>
        </div>

        {/* Área de trabajo fluida */}
        <main className="flex-1 w-full p-4 sm:p-6 lg:p-8" role="tabpanel">
          {isAdmin && !business.logo_url && !logoPromptDismissed && activeTab !== 'cuenta' && (
            <div className="mb-6 bg-paper-dim border-[1.5px] border-ink px-4 py-3 flex flex-wrap items-center justify-between gap-3 shadow-hard-line">
              <div className="flex items-center gap-3 min-w-0">
                <ImagePlus size={18} className="text-teal shrink-0" />
                <p className="text-xs sm:text-sm text-ink/90 leading-snug">
                  <strong>Personalizá tu marca:</strong> subí el logo de <strong>{business.name}</strong> para mostrarlo en el ticket,
                  el formulario y tus láminas QR <span className="text-muted">(si no subís uno, usamos tus iniciales “{businessMonogram}”).</span>
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <HardButton size="sm" variant="teal" onClick={() => selectTab('cuenta')}>
                  Subir logo
                </HardButton>
                <button
                  type="button"
                  onClick={() => {
                    setLogoPromptDismissed(true);
                    try { sessionStorage.setItem(logoPromptKey, '1'); } catch { /* noop */ }
                  }}
                  aria-label="Ocultar aviso de logo"
                  className="p-1.5 text-muted hover:text-ink cursor-pointer"
                >
                  <X size={15} />
                </button>
              </div>
            </div>
          )}

          {activeTab === 'resultados' && (
            <ResultsTab businessId={business.id} refreshKey={refreshKey} openCasesCount={rescue.active.length} now={now} />
          )}
          {activeTab === 'qrs' && (
            <QrTab
              business={business}
              isAdmin={isAdmin}
              onOpenDestination={openDestination}
              onOpenAccount={openAccount}
            />
          )}
          {activeTab === 'destino' && <DestinationTab business={business} isAdmin={isAdmin} onSaved={refreshProfile} />}
          {activeTab === 'rescate' && (
            <RescueTab
              business={business}
              rescue={rescue}
              getTemplate={getTemplate}
              now={now}
              isAdmin={isAdmin}
              onBusinessSaved={refreshProfile}
            />
          )}
          {activeTab === 'cuenta' && (
            <AccountTab business={business} isAdmin={isAdmin} onSaved={refreshProfile} />
          )}
        </main>

        {/* Footer compacto (visible en móvil/tablet; en desktop ya está en el sidebar) */}
        <footer className="lg:hidden border-t-[1.5px] border-dashed border-line-gray px-4 py-3 flex flex-wrap justify-between items-center font-mono text-[11px] text-muted gap-2 bg-paper">
          <div className="flex items-center gap-1.5">
            <span className={`inline-block w-2 h-2 ${live ? 'bg-teal' : 'bg-line-gray'}`} />
            {live ? 'EN VIVO' : 'CONECTANDO...'}
            {overdueCount > 0 && (
              <span className="text-alert-red font-bold ml-2">· {overdueCount} SLA VENCIDO{overdueCount > 1 ? 'S' : ''}</span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <span>HECHO CON</span>
            <LatidoSymbol width={20} height={13} />
            <span className="font-sans font-bold text-ink">Latido</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
