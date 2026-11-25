import React from 'react';
import { ShieldCheck } from 'lucide-react';
import Stamp from '../../../components/ui/Stamp';
import { StarsText } from '../../admin/components/PanelBits';
import { formatRelative, OUTCOME_LABELS } from '../../../lib/utils';
import { RESCUE_STATUS_LABELS } from './diagnosticsHelpers';

export default function RecentActivitySection({ recent }) {
  return (
    <section className="bg-paper border border-line-gray p-4 space-y-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-muted font-bold">
          <ShieldCheck size={14} className="text-teal" /> Últimas opiniones (datos mínimos anonimizados)
        </div>
        <span className="font-mono text-[10px] text-muted">Sin PII ni texto libre</span>
      </div>

      {recent.length === 0 ? (
        <p className="text-xs text-muted">Este negocio todavía no recibió opiniones.</p>
      ) : (
        <div className="divide-y divide-dashed divide-line-gray">
          {recent.map((ev, idx) => {
            const rBadge = ev.rescue_status ? RESCUE_STATUS_LABELS[ev.rescue_status] : null;
            return (
              <div key={`${ev.created_at}-${idx}`} className="py-2.5 first:pt-0 last:pb-0 flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <StarsText value={ev.stars} className="text-sm" />
                    <span className="font-mono text-[11px] text-muted">
                      {ev.branch_name || 'Sucursal'} · {formatRelative(ev.created_at)}
                    </span>
                  </div>
                  {ev.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-x-2 gap-y-0.5 mt-1">
                      {ev.tags.map((t) => (
                        <span key={t} className="font-mono text-[11px] text-ink/80">#{t}</span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1.5 flex-wrap font-mono text-[10px]">
                  {ev.has_comment && (
                    <span className="px-1.5 py-0.5 border border-line-gray bg-paper-dim text-muted">
                      Con comentario
                    </span>
                  )}
                  {ev.has_contact && (
                    <span className="px-1.5 py-0.5 border border-amber bg-amber/10 text-amber-ink font-bold">
                      Dejó contacto
                    </span>
                  )}
                  {rBadge && (
                    <Stamp variant={ev.rescue_outcome === 'recovered' ? 'teal' : rBadge.variant}>
                      {ev.rescue_outcome ? (OUTCOME_LABELS[ev.rescue_outcome] || rBadge.label) : rBadge.label}
                    </Stamp>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <p className="font-mono text-[10px] text-muted pt-2 border-t border-dashed border-line-gray leading-relaxed">
        Privacidad Ley 25.326: esta vista es de solo lectura y omite nombres, teléfonos, emails y comentarios escritos por clientes finales.
      </p>
    </section>
  );
}
