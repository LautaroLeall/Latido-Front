import React from 'react';
import { AlertTriangle, CheckCircle2, ExternalLink, Mail, MessageCircle, Sparkles } from 'lucide-react';
import Stamp from '../../../components/ui/Stamp';
import HardButton from '../../../components/ui/HardButton';
import { buildFeedbackUrl } from '../../../lib/utils';

export default function SupportInsightsSection({ insights, coachingWaHref, coachingMailHref, primaryToken }) {
  return (
    <section className="bg-paper border-[1.5px] border-ink p-4 shadow-hard-line space-y-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-teal shrink-0" />
          <h3 className="font-bold text-sm uppercase font-mono tracking-wider">
            Diagnóstico de acompañamiento
          </h3>
        </div>
        <Stamp variant={insights.some((i) => i.level === 'urgent') ? 'red' : insights.length ? 'amber' : 'teal'}>
          {insights.length === 0 ? 'Todo al día' : `${insights.length} ${insights.length === 1 ? 'oportunidad' : 'oportunidades'}`}
        </Stamp>
      </div>

      {insights.length === 0 ? (
        <div className="flex items-center gap-2 text-xs text-teal font-medium bg-teal/5 border border-teal/30 p-3">
          <CheckCircle2 size={15} className="shrink-0" />
          <span>
            Excelente salud: cuenta activa, con logo, Google configurado, encuesta y opiniones recientes sin SLA vencido.
          </span>
        </div>
      ) : (
        <ul className="space-y-2">
          {insights.map((ins) => (
            <li
              key={ins.title}
              className={`p-2.5 border text-xs flex items-start gap-2.5 ${ins.level === 'urgent'
                ? 'border-alert-red bg-alert-red/5'
                : ins.level === 'warn'
                  ? 'border-amber bg-amber/10'
                  : 'border-line-gray bg-paper-dim/50'
                }`}
            >
              <AlertTriangle
                size={14}
                className={`shrink-0 mt-0.5 ${ins.level === 'urgent' ? 'text-alert-red' : ins.level === 'warn' ? 'text-amber-ink' : 'text-teal'}`}
              />
              <div className="min-w-0">
                <strong className="block text-ink">{ins.title}</strong>
                <span className="text-muted leading-snug">{ins.detail}</span>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap gap-2 pt-2 border-t border-dashed border-line-gray">
        <HardButton as="a" size="sm" variant="teal" href={coachingWaHref} target="_blank" rel="noopener noreferrer">
          <MessageCircle size={13} /> Enviar sugerencias por WhatsApp
        </HardButton>
        {coachingMailHref && (
          <HardButton as="a" size="sm" variant="secondary" href={coachingMailHref} target="_blank" rel="noopener noreferrer">
            <Mail size={13} /> Enviar por Gmail
          </HardButton>
        )}
        {primaryToken && (
          <HardButton as="a" size="sm" variant="secondary" href={buildFeedbackUrl(primaryToken)} target="_blank" rel="noopener noreferrer">
            <ExternalLink size={13} /> Abrir ticket
          </HardButton>
        )}
      </div>
    </section>
  );
}
