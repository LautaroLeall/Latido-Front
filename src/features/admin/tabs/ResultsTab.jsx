import React, { useState } from 'react';
import Stamp from '../../../components/ui/Stamp';
import HardButton from '../../../components/ui/HardButton';
import Alert from '../../../components/ui/Alert';
import { StatCard, StarsText, EmptyState, SectionLabel } from '../components/PanelBits';
import { useBusinessStats, useRecentResponses } from '../useAdminData';
import { formatRelative, CHANNEL_LABELS } from '../../../lib/utils';
import { getErrorMessage } from '../../../lib/errors';

const PERIODS = [
  { days: 7, label: '7 días' },
  { days: 30, label: '30 días' },
  { days: 90, label: '90 días' }
];

export default function ResultsTab({ businessId, refreshKey, openCasesCount, now }) {
  const [days, setDays] = useState(7);
  const stats = useBusinessStats(businessId, days, refreshKey);
  const responses = useRecentResponses(businessId, refreshKey);

  const s = stats.data;
  const total = s?.total ?? 0;
  const distribution = s?.distribution ?? {};
  const topTags = Object.entries(s?.tags ?? {}).sort((a, b) => b[1] - a[1]).slice(0, 5);

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
                    <span className="w-14 text-right text-muted">{count} · {pct}%</span>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="bg-paper border border-line-gray p-4">
            <SectionLabel>Aspectos más mencionados</SectionLabel>
            {topTags.length === 0 ? (
              <p className="text-sm text-muted">Todavía no hay etiquetas en este período.</p>
            ) : (
              <ul className="space-y-1.5">
                {topTags.map(([tag, count]) => (
                  <li key={tag} className="flex justify-between font-mono text-sm border-b border-dashed border-line-gray pb-1">
                    <span>#{tag}</span>
                    <strong>{count}</strong>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* Últimas opiniones */}
      <div>
        <SectionLabel>Últimas opiniones</SectionLabel>

        {responses.error && (
          <Alert variant="error" className="mb-3">{getErrorMessage(responses.error, 'No pudimos cargar las opiniones.')}</Alert>
        )}

        {responses.loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="h-24 bg-paper-dim border border-line-gray animate-pulse" />)}
          </div>
        ) : responses.items.length === 0 ? (
          <EmptyState title="Todavía no recibiste opiniones">
            Imprimí tu QR desde la pestaña “Mis QR &amp; NFC” y ponelo en el mostrador.
          </EmptyState>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
              {responses.items.map(resp => (
                <article
                  key={resp.id}
                  className={`p-4 bg-paper border border-line-gray border-l-4 animate-fadeIn flex flex-col justify-between ${resp.stars <= 2 ? 'border-l-alert-red' : resp.stars === 3 ? 'border-l-amber' : 'border-l-teal'
                    }`}
                >
                  <div>
                    <div className="flex justify-between items-start gap-2 flex-wrap">
                      <div className="flex items-center gap-2 flex-wrap">
                        <StarsText value={resp.stars} />
                        <span className="font-mono text-xs text-muted">
                          {formatRelative(resp.created_at, now)}
                          {resp.branch?.name ? ` · ${resp.branch.name}` : ''}
                        </span>
                      </div>
                      {resp.contact ? <Stamp variant="amber">Dejó contacto</Stamp> : <Stamp variant="ink">Anónimo</Stamp>}
                    </div>
                    <p className="mt-2 text-sm leading-relaxed break-words">
                      {resp.comment ? `“${resp.comment}”` : <span className="text-muted italic">Sin comentario</span>}
                    </p>
                    {resp.tags?.length > 0 && (
                      <div className="flex flex-wrap gap-x-2 gap-y-1 mt-2">
                        {resp.tags.map(t => <span key={t} className="font-mono text-xs text-muted">#{t}</span>)}
                      </div>
                    )}
                  </div>
                  {resp.contact && (
                    <div className="mt-2.5 pt-2 border-t border-dashed border-line-gray font-mono text-xs text-muted flex flex-wrap gap-x-3 gap-y-1">
                      <span>Cliente: <strong className="text-ink">{resp.contact.full_name}</strong></span>
                      <span>Canal: <strong className="text-ink">{CHANNEL_LABELS[resp.contact.preferred_channel] || resp.contact.preferred_channel}</strong></span>
                    </div>
                  )}
                </article>
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
