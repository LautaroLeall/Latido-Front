import React from 'react';
import { Mail, MessageCircle } from 'lucide-react';
import HardButton from '../../../../components/ui/HardButton';
import Stamp from '../../../../components/ui/Stamp';
import { formatMoney } from '../../../../lib/utils';
import { buildWhatsAppUrl, buildMailUrl, displayPhone, CONTACT_EMAIL } from '../../../../lib/contact';

export default function PlanOverviewCard({ business, supports, counts, loadingPlan }) {
  const currentPlan = business.plan;
  const used = supports?.used ?? counts.qrActive;
  const limit = supports?.limit ?? currentPlan?.supports ?? 1;
  const free = Math.max(0, limit - used);
  const usedPct = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;
  const planName = supports?.plan_name || currentPlan?.name || 'Plan Base';
  const upgradeMessage = `Hola, soy de ${business.name} (plan actual: ${planName}, ${used}/${limit} soportes). Quiero consultar para mejorar de plan.`;

  return (
    <section className="bg-paper border-[1.5px] border-ink p-5 shadow-hard-line space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3 pb-3 border-b border-line-gray">
        <div>
          <span className="font-mono text-[11px] uppercase tracking-wider text-muted">Plan actual</span>
          <h2 className="text-2xl font-bold tracking-tight mt-0.5">{planName}</h2>
        </div>
        <div className="text-right">
          {currentPlan?.is_custom ? (
            <Stamp variant="amber">A medida</Stamp>
          ) : currentPlan?.price_monthly != null ? (
            <div>
              <div className="font-bold text-xl tabular-nums">
                {formatMoney(currentPlan.price_monthly, currentPlan.currency)}
              </div>
              <div className="font-mono text-[10px] text-muted uppercase">por mes</div>
            </div>
          ) : (
            <Stamp variant="teal">Activo</Stamp>
          )}
        </div>
      </div>

      {loadingPlan ? (
        <div className="h-24 bg-paper-dim border border-line-gray animate-pulse" />
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between font-mono text-xs">
            <span className="uppercase tracking-wider text-muted">Soportes QR + NFC activos</span>
            <strong className="text-sm text-ink">{used} de {limit}</strong>
          </div>
          <div className="h-3.5 bg-paper-dim border border-line-gray">
            <div
              className={`h-full transition-all ${free === 0 ? 'bg-amber' : 'bg-teal'}`}
              style={{ width: `${usedPct}%` }}
            />
          </div>
          <div className="grid grid-cols-3 gap-2 pt-1 font-mono text-xs">
            <div className="bg-paper-dim border border-line-gray p-2 sm:p-2.5 min-w-0">
              <div className="text-[10px] uppercase text-muted truncate">Activos</div>
              <div className="text-lg font-bold text-teal tabular-nums">{used}</div>
            </div>
            <div className="bg-paper-dim border border-line-gray p-2 sm:p-2.5 min-w-0">
              <div className="text-[10px] uppercase text-muted truncate">Disponibles</div>
              <div className="text-lg font-bold tabular-nums">{free}</div>
            </div>
            <div className="bg-paper-dim border border-line-gray p-2 sm:p-2.5 min-w-0">
              <div className="text-[10px] uppercase text-muted truncate">Sucursales</div>
              <div className="text-lg font-bold tabular-nums">{counts.branches}</div>
            </div>
          </div>
          <p className="text-xs text-muted leading-relaxed">
            Todos los planes incluyen las mismas funciones completas (Modo Rescate, tiempo real y destino Google).
            La diferencia es cuántos soportes físicos (QR + NFC) podés tener activos en simultáneo.
          </p>
        </div>
      )}

      <div className="pt-4 border-t border-dashed border-line-gray space-y-3">
        <div className="font-mono text-[11px] uppercase tracking-wider text-teal font-bold">
          ¿Necesitás más soportes o mejorar tu plan?
        </div>
        <p className="text-xs text-muted">
          Escribinos y te ampliamos el plan al instante sin perder historial ni cambiar tus QR/NFC actuales.
        </p>
        <div className="flex flex-wrap gap-2">
          <HardButton
            as="a"
            size="sm"
            variant="teal"
            target="_blank"
            rel="noopener noreferrer"
            href={buildWhatsAppUrl(upgradeMessage)}
          >
            <MessageCircle size={14} /> Mejorar plan por WhatsApp
          </HardButton>
          <HardButton
            as="a"
            size="sm"
            variant="secondary"
            className="break-all"
            target="_blank"
            rel="noopener noreferrer"
            href={buildMailUrl(`Cambio de plan Latido · ${business.name}`, upgradeMessage)}
          >
            <Mail size={14} className="shrink-0" /> {CONTACT_EMAIL}
          </HardButton>
        </div>
        <div className="font-mono text-[11px] text-muted">
          WhatsApp comercial: {displayPhone()}
        </div>
      </div>
    </section>
  );
}
