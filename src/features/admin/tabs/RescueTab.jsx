import React, { useState } from 'react';
import { HelpCircle } from 'lucide-react';
import HardButton from '../../../components/ui/HardButton';
import Alert from '../../../components/ui/Alert';
import { StatCard, EmptyState, SectionLabel } from '../components/PanelBits';
import { getErrorMessage } from '../../../lib/errors';
import { formatMoney } from '../../../lib/utils';
import ActiveCaseCard from './rescue/ActiveCaseCard';
import HistoryList from './rescue/HistoryList';
import RecoveredValueGuide from './rescue/RecoveredValueGuide';
import RescueSettings from './rescue/RescueSettings';

export default function RescueTab({ business, rescue, getTemplate, now, isAdmin, onBusinessSaved }) {
  const [subtab, setSubtab] = useState('activos');
  const [showValueGuide, setShowValueGuide] = useState(false);
  const { active, history, metrics, loading, error, reload } = rescue;
  const currency = business.currency;
  const avgTicket = Number(business.avg_ticket_value || 0);
  const recoveredValue = Number(metrics?.recoveredValue || 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Casos abiertos" value={active.length} tone={active.length ? 'red' : 'ink'} loading={loading} />
        <StatCard label="Clientes rescatados" value={metrics?.recovered ?? 0} tone="teal" loading={loading} />
        <StatCard
          label="Ventas recuperadas"
          badge="ESTIMADO"
          value={formatMoney(recoveredValue, currency)}
          tone="teal"
          loading={loading}
          footer={
            <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1 font-mono text-[10px]">
              {avgTicket <= 0 ? (
                isAdmin ? (
                  <button
                    type="button"
                    onClick={() => { setSubtab('ajustes'); setShowValueGuide(false); }}
                    className="text-amber-ink font-bold underline cursor-pointer text-left"
                  >
                    Configurá ticket promedio →
                  </button>
                ) : (
                  <span className="text-muted">Ticket base en {formatMoney(0, currency)}</span>
                )
              ) : (
                <span className="text-muted">Base: {formatMoney(avgTicket, currency)}/cliente</span>
              )}
              {subtab !== 'ajustes' && (
                <button
                  type="button"
                  onClick={() => setShowValueGuide(v => !v)}
                  aria-expanded={showValueGuide}
                  className="inline-flex items-center gap-1 text-teal hover:underline cursor-pointer shrink-0"
                >
                  <HelpCircle size={11} /> {showValueGuide ? 'Ocultar' : '¿Qué es?'}
                </button>
              )}
            </div>
          }
        />
        <StatCard label="Tasa de rescate" value={`${metrics?.rescueRate ?? 0}%`} loading={loading} />
      </div>

      {showValueGuide && subtab !== 'ajustes' && (
        <RecoveredValueGuide
          currency={currency}
          avgTicket={avgTicket}
          isAdmin={isAdmin}
          onOpenSettings={() => { setSubtab('ajustes'); setShowValueGuide(false); }}
          onClose={() => setShowValueGuide(false)}
        />
      )}

      {!business.rescue_enabled && (
        <Alert variant="warning" title="Modo Rescate pausado">
          No se están abriendo casos nuevos. Activalo desde “Ajustes”.
        </Alert>
      )}

      <div className="flex flex-wrap gap-2">
        {[
          { id: 'activos', label: `Casos activos${active.length ? ` (${active.length})` : ''}` },
          { id: 'historial', label: `Historial${history.length ? ` (${history.length})` : ''}` },
          { id: 'ajustes', label: 'Ajustes' }
        ].map(s => (
          <HardButton
            key={s.id}
            size="sm"
            variant={subtab === s.id ? 'primary' : 'secondary'}
            onClick={() => setSubtab(s.id)}
            aria-pressed={subtab === s.id}
          >
            {s.label}
          </HardButton>
        ))}
      </div>

      {error && subtab !== 'ajustes' && (
        <Alert variant="error">{getErrorMessage(error, 'No pudimos cargar los casos de rescate.')}</Alert>
      )}

      {subtab === 'activos' && (
        loading ? (
          <div className="h-40 bg-paper-dim border border-line-gray animate-pulse" />
        ) : active.length === 0 ? (
          <EmptyState title="Sin casos activos">
            Cuando un cliente insatisfecho deje su contacto, aparece acá con su reloj.
          </EmptyState>
        ) : (
          <div className="space-y-4">
            <SectionLabel>Ordenados por vencimiento del SLA</SectionLabel>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {active.map(item => (
                <ActiveCaseCard
                  key={item.id}
                  item={item}
                  business={business}
                  getTemplate={getTemplate}
                  now={now}
                  onChanged={reload}
                />
              ))}
            </div>
          </div>
        )
      )}

      {subtab === 'historial' && (
        <HistoryList items={history} business={business} onChanged={reload} />
      )}

      {subtab === 'ajustes' && (
        <RescueSettings business={business} isAdmin={isAdmin} onSaved={onBusinessSaved} />
      )}
    </div>
  );
}
