import React, { useState } from 'react';
import { LogOut, Menu, RotateCw, X } from 'lucide-react';
import LatidoLogo from '../../../components/branding/LatidoLogo';
import HardButton from '../../../components/ui/HardButton';

export default function SuperShell({
  navItems,
  currentNav,
  view,
  profileName,
  rowsCount,
  pendingKitsCount,
  loading,
  canCreateBusiness,
  onSelectView,
  onReload,
  onSignOut,
  children
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  function handleSelect(id) {
    setMenuOpen(false);
    onSelectView(id);
  }

  return (
    <div className="min-h-[100dvh] w-full max-w-full flex flex-col lg:flex-row bg-paper-dim">
      {/* Sidebar Escritorio / Notebook (lg+) */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 xl:w-72 shrink-0 bg-ink text-paper sticky top-0 h-[100dvh] border-r-2 border-ink">
        <div className="p-5 border-b border-paper/15">
          <LatidoLogo variant="dark" fontSize={20} symWidth={34} />
          <div className="mt-3 flex items-center gap-2">
            <span className="bg-amber text-ink font-mono font-bold text-[10px] px-1.5 py-0.5 uppercase tracking-wider">
              Super Admin
            </span>
            <span className="font-mono text-xs text-paper/75 truncate">{profileName}</span>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto" aria-label="Menú de plataforma">
          {navItems.map(item => {
            const Icon = item.icon;
            const selected = view === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelect(item.id)}
                aria-current={selected ? 'page' : undefined}
                className={`w-full flex items-center justify-between gap-2 px-3.5 py-3 text-left font-mono text-xs uppercase tracking-wider cursor-pointer transition-colors border-l-[3px] ${selected
                  ? 'bg-paper/10 text-paper font-bold border-l-amber'
                  : 'text-paper/70 hover:text-paper hover:bg-paper/5 border-l-transparent'
                  }`}
              >
                <span className="flex items-center gap-2.5 min-w-0">
                  <Icon size={16} className={selected ? 'text-amber shrink-0' : 'text-paper/60 shrink-0'} />
                  <span className="truncate">{item.label}</span>
                </span>
                {item.id === 'negocios' && !loading && (
                  <span className="font-mono text-[10px] px-1.5 py-0.5 bg-paper/15 text-paper shrink-0">
                    {rowsCount}
                  </span>
                )}
                {item.id === 'kits' && !loading && pendingKitsCount > 0 && (
                  <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 bg-amber text-ink shrink-0">
                    {pendingKitsCount} pend.
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-paper/15 space-y-3">
          <p className="font-mono text-[10px] text-paper/55 leading-relaxed">
            Ley 25.326: sin acceso a comentarios ni contactos de clientes finales.
          </p>
          <button
            type="button"
            onClick={onSignOut}
            className="w-full py-2 px-3 border border-paper/25 font-mono text-[11px] uppercase tracking-wider text-paper/80 hover:text-paper hover:bg-paper/10 flex items-center justify-center gap-2 cursor-pointer"
          >
            <LogOut size={13} /> Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Header Móvil y Tablet (<lg) */}
      <header className="lg:hidden bg-ink text-paper sticky top-0 z-40 border-b border-ink pt-[env(safe-area-inset-top)]">
        <div className="px-3.5 sm:px-4 py-3 flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <LatidoLogo variant="dark" fontSize={17} symWidth={28} />
            <span className="bg-amber text-ink font-mono font-bold text-[9.5px] px-1.5 py-0.5 uppercase shrink-0">
              Super Admin
            </span>
          </div>
          <button
            type="button"
            onClick={() => setMenuOpen(v => !v)}
            aria-expanded={menuOpen}
            aria-label="Menú"
            className="p-2 border border-paper/25 text-paper cursor-pointer shrink-0"
          >
            {menuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>

        {menuOpen && (
          <div className="px-4 pb-4 pt-2 border-t border-paper/15 bg-ink space-y-2.5 animate-fadeIn">
            <div className="font-mono text-xs text-paper/75">Conectado como {profileName}</div>
            <button
              type="button"
              onClick={onSignOut}
              className="w-full py-2.5 px-3 border border-paper/30 font-mono text-xs uppercase tracking-wider text-paper flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogOut size={14} /> Cerrar sesión
            </button>
          </div>
        )}

        <nav className="bg-paper-dim text-ink border-b-[1.5px] border-line-gray px-2 sm:px-4 flex gap-1 overflow-x-auto no-scrollbar overscroll-x-contain">
          {navItems.map(item => {
            const Icon = item.icon;
            const selected = view === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelect(item.id)}
                className={`py-3 px-3 border-b-2 font-mono font-bold text-[11px] uppercase tracking-wider flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-colors ${selected ? 'border-teal text-ink' : 'border-transparent text-muted hover:text-ink'}`}
              >
                <Icon size={14} className={selected ? 'text-teal' : 'text-muted'} />
                <span>{item.label}</span>
                {item.id === 'kits' && !loading && pendingKitsCount > 0 && (
                  <span className="bg-amber text-ink font-mono text-[9.5px] font-bold px-1.5 py-0.5 leading-none">
                    {pendingKitsCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </header>

      {/* Contenido principal */}
      <div className="flex-1 min-w-0 flex flex-col bg-paper">
        <div className="hidden lg:flex items-center justify-between gap-4 px-8 py-4 border-b border-line-gray bg-paper-dim/50">
          <div className="min-w-0">
            <h1 className="text-xl font-bold tracking-tight">{currentNav.label}</h1>
            <p className="font-mono text-xs text-muted mt-0.5">{currentNav.subtitle}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <HardButton size="sm" variant="secondary" onClick={onReload} disabled={loading}>
              <RotateCw size={13} /> Actualizar
            </HardButton>
            {view !== 'alta' && (
              <HardButton size="sm" variant="teal" onClick={() => onSelectView('alta')} disabled={!canCreateBusiness}>
                + Nuevo negocio
              </HardButton>
            )}
          </div>
        </div>

        <main className="flex-1 w-full min-w-0 p-3.5 sm:p-6 lg:p-8 pb-[max(1.5rem,env(safe-area-inset-bottom))] space-y-6">
          {children}
        </main>
      </div>
    </div>
  );
}
