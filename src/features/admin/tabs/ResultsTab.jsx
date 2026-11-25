import React, { useState } from 'react';
import HardButton from '../../../components/ui/HardButton';
import Alert from '../../../components/ui/Alert';
import { StatCard, EmptyState, SectionLabel } from '../components/PanelBits';
import { useBusinessStats, useRecentResponses } from '../useAdminData';
import { getErrorMessage } from '../../../lib/errors';
import ResponseCard from './ResponseCard';

const PERIODS = [
  {
    days: 7,
    label: '7 días'
  },
  {
    days: 30,
    label: '30 días'
  },
  {
    days: 90,
    label: '90 días'
  }
];

export default function ResultsTab({ business, businessId, refreshKey, openCasesCount, now }) {
  const [days, setDays] = useState(7);
  const [opinionFilter, setOpinionFilter] = useState('all'); // all | contact | high | low
  const activeBusinessId = business?.id || businessId;
  const stats = useBusinessStats(activeBusinessId, days, refreshKey);
  const responses = useRecentResponses(activeBusinessId, refreshKey);

  const s = stats.data;
  const total = s?.total ?? 0;
  const distribution = s?.distribution ?? {};
  const topTags = Object.entries(s?.tags ?? {}).sort((a, b) => b[1] - a[1]).slice(0, 5);

  const withContactCount = responses.items.filter(r => !!r.contact).length;
  const filteredResponses = responses.items.filter(r => {
    if (opinionFilter === 'contact') return !!r.contact;
    if (opinionFilter === 'high') return r.stars >= 4;
    if (opinionFilter === 'low') return r.stars <= 2;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Período */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-mono text-xs text-muted uppercase tracking-wider mr-1">Período:</span>
        {PERIODS.map(p => (
          <HardButton
            key={p.days}
            size="sm"
            variant={days === p.days ? 'primary' : 'secondary'}
            onClick={() => setDays(p.days)}
            aria-pressed={days === p.days}
          >
            {p.label}
          </HardButton>
        ))}
      </div>

      {stats.error && <Alert variant="error">{getErrorMessage(stats.error, 'No pudimos cargar las métricas.')}</Alert>}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Promedio" value={s?.avg ?? '—'} suffix={s?.avg ? '/ 5' : null} loading={stats.loading} />
        <StatCard label={`Opiniones (${days}d)`} value={total} loading={stats.loading} />
        <StatCard label="Alertas (≤ 2★)" value={s?.low ?? 0} tone={s?.low ? 'red' : 'ink'} loading={stats.loading} />
        <StatCard label="Casos abiertos" value={openCasesCount} tone={openCasesCount ? 'amber' : 'ink'} />
      </div>

      {/* Distribución + etiquetas */}
      {!stats.loading && total > 0 && (
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-paper border border-line-gray p-4">
            <SectionLabel>Distribución de estrellas</SectionLabel>
            <div className="space-y-1.5">
              {[5, 4, 3, 2, 1].map(star => {
                const count = Number(distribution[star] || 0);
                const pct = total ? Math.round((count / total) * 100) : 0;
                return (
                  <div key={star} className="flex items-center gap-2 font-mono text-xs">
                    <span className="w-6 text-right">{star}★</span>
                    <div className="flex-1 h-3 bg-paper-dim border border-line-gray">
                      <div
                        className={`h-full ${star <= 2 ? 'bg-alert-red' : star === 3 ? 'bg-amber' : 'bg-teal'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="min-w-[68px] shrink-0 text-right text-muted tabular-nums whitespace-nowrap">{count} · {pct}%</span>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="bg-paper border border-line-gray p-4 min-w-0">
            <SectionLabel>Aspectos más mencionados</SectionLabel>
            {topTags.length === 0 ? (
              <p className="text-sm text-muted">Todavía no hay etiquetas en este período.</p>
            ) : (
              <ul className="space-y-1.5">
                {topTags.map(([tag, count]) => (
                  <li key={tag} className="flex justify-between gap-2 font-mono text-sm border-b border-dashed border-line-gray pb-1">
                    <span className="truncate">#{tag}</span>
                    <strong className="shrink-0 tabular-nums">{count}</strong>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* Últimas opiniones */}
      <div>
        <SectionLabel
          right={responses.items.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {[
                { id: 'all', label: `Todas (${responses.items.length})` },
                { id: 'contact', label: `Con contacto (${withContactCount})` },
                { id: 'high', label: 'Positivas (4–5★)' },
                { id: 'low', label: 'Bajas (≤ 2★)' }
              ].map(f => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setOpinionFilter(f.id)}
                  aria-pressed={opinionFilter === f.id}
                  className={`font-mono text-[11px] px-2.5 py-1 border cursor-pointer transition-colors ${opinionFilter === f.id
                    ? 'bg-ink text-paper border-ink font-bold'
                    : 'bg-paper text-muted border-line-gray hover:border-ink hover:text-ink'
                    }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          )}
        >
          Últimas opiniones
        </SectionLabel>

        {responses.error && (
          <Alert variant="error" className="mb-3">{getErrorMessage(responses.error, 'No pudimos cargar las opiniones.')}</Alert>
        )}

        {responses.loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="h-24 bg-paper-dim border border-line-gray animate-pulse" />)}
          </div>
        ) : responses.items.length === 0 ? (
          <EmptyState title="Todavía no recibiste opiniones">
            Apoyá tu soporte físico QR + NFC en el mostrador y las opiniones van a aparecer acá al instante.
          </EmptyState>
        ) : filteredResponses.length === 0 ? (
          <EmptyState title="No hay opiniones con este filtro">
            Probá con otro filtro o cargá más opiniones.
          </EmptyState>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
              {filteredResponses.map(resp => (
                <ResponseCard key={resp.id} resp={resp} business={business} now={now} />
              ))}
            </div>

            {responses.hasMore && (
              <div className="text-center pt-2">
                <HardButton variant="secondary" size="sm" onClick={responses.loadMore} disabled={responses.loadingMore}>
                  {responses.loadingMore ? 'CARGANDO...' : 'CARGAR MÁS'}
                </HardButton>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
