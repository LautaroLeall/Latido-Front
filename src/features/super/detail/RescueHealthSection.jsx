import React from 'react';
import { LifeBuoy } from 'lucide-react';
import Stamp from '../../../components/ui/Stamp';
import { formatMoney } from '../../../lib/utils';

export default function RescueHealthSection({ business, rescue }) {
  if (!rescue) return null;
  const r = rescue;
  const b = business;

  const closedCases = Number(r.cases_recovered || 0) + Number(r.cases_no_response || 0) + Number(r.cases_declined || 0);
  const rescueRate = closedCases > 0 ? Math.round((Number(r.cases_recovered || 0) / closedCases) * 100) : 0;
  const slaRate = Number(r.contacted_total || 0) > 0
    ? Math.round((Number(r.within_sla_count || 0) / Number(r.contacted_total)) * 100)
    : null;

  return (
    <section className="bg-paper border border-line-gray p-4 space-y-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-muted font-bold">
          <LifeBuoy size={14} className="text-teal" /> Salud del Modo Rescate
        </div>
        <Stamp variant={b.rescue_enabled ? 'teal' : 'ink'}>
          {b.rescue_enabled ? `Activo · ≤${b.rescue_threshold}★ · SLA ${b.rescue_sla_minutes}m` : 'Pausado'}
        </Stamp>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 font-mono">
        <div className="bg-paper-dim border border-line-gray p-2.5">
          <div className="text-[10px] uppercase text-muted">Tasa rescate</div>
          <div className="text-lg font-bold text-teal">{rescueRate}%</div>
        </div>
        <div className="bg-paper-dim border border-line-gray p-2.5">
          <div className="text-[10px] uppercase text-muted">Dentro de SLA</div>
          <div className="text-lg font-bold">{slaRate != null ? `${slaRate}%` : '—'}</div>
        </div>
        <div className="bg-paper-dim border border-line-gray p-2.5">
          <div className="text-[10px] uppercase text-muted">1.º contacto</div>
          <div className="text-lg font-bold">
            {r.avg_first_response_min != null ? `${r.avg_first_response_min} min` : '—'}
          </div>
        </div>
        <div className="bg-paper-dim border border-line-gray p-2.5">
          <div className="text-[10px] uppercase text-muted">Recuperado est.</div>
          <div className="text-base font-bold text-teal truncate">
            {formatMoney(r.recovered_value, b.currency)}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1 font-mono text-[11px] text-muted pt-1">
        <span>Total: <strong className="text-ink">{r.cases_total}</strong></span>
        <span>Abiertos: <strong className={Number(r.cases_open) > 0 ? 'text-alert-red' : 'text-ink'}>{r.cases_open}</strong></span>
        {Number(r.cases_overdue) > 0 && (
          <span className="text-alert-red font-bold">SLA vencidos: {r.cases_overdue}</span>
        )}
        <span>Contactados: <strong className="text-ink">{r.cases_contacted}</strong></span>
        <span>Rescatados: <strong className="text-teal">{r.cases_recovered}</strong></span>
        <span>Sin resp.: <strong className="text-ink">{r.cases_no_response}</strong></span>
        <span>Rechazó: <strong className="text-ink">{r.cases_declined}</strong></span>
        <span>Descartados: <strong className="text-ink">{r.cases_dismissed}</strong></span>
      </div>
    </section>
  );
}
