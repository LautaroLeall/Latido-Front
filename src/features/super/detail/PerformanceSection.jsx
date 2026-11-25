import React from 'react';
import { Activity } from 'lucide-react';
import { formatRelative } from '../../../lib/utils';

export default function PerformanceSection({ business, metrics }) {
  const m = metrics;
  const r30 = Number(m?.responses_30d ?? business.responses_30d ?? 0);
  const rPrev30 = Number(m?.responses_prev_30d ?? 0);
  const delta30 = r30 - rPrev30;

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-muted font-bold">
        <Activity size={14} className="text-teal" /> Rendimiento de opiniones
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="bg-paper border border-line-gray p-3">
          <div className="font-mono text-[10px] uppercase text-muted">Últimos 7 días</div>
          <div className="text-xl font-bold mt-0.5 tabular-nums">{m ? m.responses_7d : '—'}</div>
        </div>
        <div className="bg-paper border border-line-gray p-3">
          <div className="font-mono text-[10px] uppercase text-muted">Últimos 30 días</div>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-xl font-bold tabular-nums">{r30}</span>
            {m && rPrev30 > 0 && (
              <span className={`font-mono text-[10px] font-bold ${delta30 >= 0 ? 'text-teal' : 'text-alert-red'}`}>
                {delta30 >= 0 ? `+${delta30}` : delta30} vs ant.
              </span>
            )}
          </div>
        </div>
        <div className="bg-paper border border-line-gray p-3">
          <div className="font-mono text-[10px] uppercase text-muted">Promedio</div>
          <div className="text-xl font-bold text-amber-ink mt-0.5 tabular-nums">
            {m?.avg_stars_30d ? `★ ${m.avg_stars_30d}` : business.avg_stars ? `★ ${business.avg_stars}` : '—'}
          </div>
          {m?.avg_stars_all != null && (
            <div className="font-mono text-[10px] text-muted">Histórico: ★ {m.avg_stars_all}</div>
          )}
        </div>
        <div className="bg-paper border border-line-gray p-3">
          <div className="font-mono text-[10px] uppercase text-muted">Última opinión</div>
          <div className="text-sm font-bold mt-1 leading-tight">
            {m?.last_response_at ? formatRelative(m.last_response_at) : 'Sin actividad'}
          </div>
          {m && Number(m.low_ratings_30d || 0) > 0 && (
            <div className="font-mono text-[10px] text-alert-red mt-0.5">
              {m.low_ratings_30d} alerta{Number(m.low_ratings_30d) === 1 ? '' : 's'} (≤2★) en 30d
            </div>
          )}
        </div>
      </div>

      {m && Number(m.responses_total || 0) > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="bg-paper border border-line-gray p-4">
            <div className="font-mono text-[10px] uppercase tracking-wider text-muted font-bold mb-2">
              Distribución histórica ({m.responses_total})
            </div>
            <div className="space-y-1.5">
              {[5, 4, 3, 2, 1].map((star) => {
                const cnt = Number(m.distribution?.[star] || 0);
                const pct = m.responses_total ? Math.round((cnt / m.responses_total) * 100) : 0;
                return (
                  <div key={star} className="flex items-center gap-2 font-mono text-[11px]">
                    <span className="w-6 text-right">{star}★</span>
                    <div className="flex-1 h-2.5 bg-paper-dim border border-line-gray">
                      <div
                        className={`h-full ${star <= 2 ? 'bg-alert-red' : star === 3 ? 'bg-amber' : 'bg-teal'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="w-14 text-right text-muted tabular-nums">{cnt} · {pct}%</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-paper border border-line-gray p-4">
            <div className="font-mono text-[10px] uppercase tracking-wider text-muted font-bold mb-2">
              Aspectos más mencionados (90 días)
            </div>
            {m.top_tags?.length > 0 ? (
              <ul className="space-y-1.5">
                {m.top_tags.map((item) => (
                  <li key={item.tag} className="flex justify-between font-mono text-xs border-b border-dashed border-line-gray pb-1 last:border-0">
                    <span className="truncate pr-2">#{item.tag}</span>
                    <strong className="tabular-nums">{item.count}</strong>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-muted">Todavía no hay etiquetas en los últimos 90 días.</p>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
