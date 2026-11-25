import React, { useMemo, useState } from 'react';
import { Nfc, PackageCheck, PlusCircle, Radio, Wrench } from 'lucide-react';
import HardButton from '../../components/ui/HardButton';
import Alert from '../../components/ui/Alert';
import { EmptyState } from '../admin/components/PanelBits';
import { normalizeSearch } from '../../lib/utils';
import { getKitStage } from './kits/kitStages';
import KitCard from './kits/KitCard';
import NewKitPanel from './kits/NewKitPanel';

export { getKitStage };

/**
 * Centro de Operaciones de Kits Físicos (QR + NFC) para Super Admin.
 */
export default function KitsManager({
  kits,
  businesses,
  loading,
  migrationMissing,
  onChanged,
  onOpenBusiness,
  onCreateBusiness
}) {
  const [stageFilter, setStageFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [showNewKit, setShowNewKit] = useState(false);

  const counts = useMemo(() => {
    const c = { all: kits.length, prepare: 0, ready: 0, delivered: 0, inactive: 0 };
    for (const k of kits) c[getKitStage(k)] += 1;
    return c;
  }, [kits]);

  const filtered = useMemo(() => {
    const q = normalizeSearch(query.trim());
    return kits.filter((k) => {
      if (stageFilter !== 'all' && getKitStage(k) !== stageFilter) return false;
      if (!q) return true;
      return (
        normalizeSearch(k.business_name).includes(q) ||
        normalizeSearch(k.branch_name).includes(q) ||
        normalizeSearch(k.owner_name).includes(q) ||
        normalizeSearch(k.token).includes(q) ||
        normalizeSearch(k.kit_notes).includes(q)
      );
    });
  }, [kits, stageFilter, query]);

  return (
    <div className="space-y-5">
      {migrationMissing && (
        <Alert variant="warning" title="Migración 015 pendiente en Supabase">
          Todavía podés ver los soportes, copiar sus URLs y descargar sus QR/láminas HD. Para marcar chips NFC grabados, registrar fechas de entrega y crear soportes extras desde acá, ejecutá <code>015_gestion_kits_super_admin.sql</code> en Supabase SQL Editor.
        </Alert>
      )}

      {/* Tarjetas de etapas clicables */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { id: 'prepare', label: 'Por preparar (NFC)', value: counts.prepare, accent: counts.prepare > 0 ? 'border-amber bg-amber/10' : 'border-line-gray bg-paper', valCls: counts.prepare > 0 ? 'text-amber-ink' : 'text-ink', icon: Wrench },
          { id: 'ready', label: 'Listos p/ entregar', value: counts.ready, accent: counts.ready > 0 ? 'border-ink bg-paper-dim' : 'border-line-gray bg-paper', valCls: 'text-ink', icon: Nfc },
          { id: 'delivered', label: 'Entregados', value: counts.delivered, accent: 'border-line-gray bg-paper', valCls: 'text-teal', icon: PackageCheck },
          { id: 'all', label: 'Total soportes', value: counts.all, accent: 'border-line-gray bg-paper', valCls: 'text-ink', icon: Radio }
        ].map((card) => {
          const Icon = card.icon;
          const active = stageFilter === card.id;
          return (
            <button
              key={card.id}
              type="button"
              onClick={() => setStageFilter(card.id)}
              aria-pressed={active}
              className={`p-3.5 sm:p-4 text-left border-[1.5px] transition-all cursor-pointer ${active ? 'border-ink shadow-hard-teal bg-paper' : `${card.accent} hover:border-ink`
                }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-[10px] uppercase tracking-wider text-muted font-bold">
                  {card.label}
                </span>
                <Icon size={14} className="text-muted shrink-0" />
              </div>
              <div className={`text-2xl sm:text-3xl font-bold mt-1.5 leading-none ${card.valCls}`}>
                {loading ? '—' : card.value}
              </div>
            </button>
          );
        })}
      </div>

      {/* Barra de búsqueda, filtros y emisión rápida */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: 'all', label: `Todos (${counts.all})` },
            { id: 'prepare', label: `Por armar (${counts.prepare})` },
            { id: 'ready', label: `Listos (${counts.ready})` },
            { id: 'delivered', label: `Entregados (${counts.delivered})` },
            ...(counts.inactive > 0 ? [{ id: 'inactive', label: `Pausados (${counts.inactive})` }] : [])
          ].map((f) => (
            <HardButton
              key={f.id}
              size="sm"
              variant={stageFilter === f.id ? 'primary' : 'secondary'}
              onClick={() => setStageFilter(f.id)}
            >
              {f.label}
            </HardButton>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar negocio, sucursal o nota..."
            aria-label="Buscar soporte por negocio, sucursal o nota"
            className="bg-paper text-ink border-[1.5px] border-ink px-3 py-2 min-h-[44px] sm:min-h-[38px] text-base sm:text-sm rounded-none outline-none focus:border-teal flex-1 min-w-0 sm:w-64"
          />
          {!migrationMissing && businesses.some(b => b.active) && (
            <HardButton size="sm" variant="teal" className="shrink-0" onClick={() => setShowNewKit(v => !v)}>
              <PlusCircle size={14} /> Nuevo soporte
            </HardButton>
          )}
        </div>
      </div>

      {showNewKit && !migrationMissing && (
        <NewKitPanel businesses={businesses} onCreated={onChanged} onClose={() => setShowNewKit(false)} />
      )}

      {loading ? (
        <div className="space-y-4">
          <div className="h-56 bg-paper-dim border border-line-gray animate-pulse" />
          <div className="h-56 bg-paper-dim border border-line-gray animate-pulse" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState title={kits.length ? 'No hay soportes en esta etapa' : 'Todavía no hay soportes físicos para armar'}>
          {kits.length === 0 && onCreateBusiness && (
            <div className="mt-3">
              <HardButton size="sm" variant="teal" onClick={onCreateBusiness}>
                + Dar de alta primer negocio
              </HardButton>
            </div>
          )}
        </EmptyState>
      ) : (
        <div className="space-y-4">
          {filtered.map((kit) => (
            <KitCard
              key={kit.qr_id}
              kit={kit}
              migrationMissing={migrationMissing}
              onChanged={onChanged}
              onOpenBusiness={onOpenBusiness}
            />
          ))}
        </div>
      )}
    </div>
  );
}
