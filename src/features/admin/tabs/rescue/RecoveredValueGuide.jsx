import React from 'react';
import { HelpCircle, X } from 'lucide-react';
import HardButton from '../../../../components/ui/HardButton';
import { formatMoney } from '../../../../lib/utils';

export default function RecoveredValueGuide({ currency = 'ARS', avgTicket = 0, isAdmin = false, onOpenSettings, onClose }) {
  const exampleTicket = formatMoney(30000, currency);
  const exampleTotal = formatMoney(150000, currency);

  return (
    <aside className="bg-paper border-[1.5px] border-ink p-4 sm:p-5 shadow-hard-line space-y-3.5 animate-fadeIn">
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="font-mono text-[10px] uppercase tracking-wider text-teal font-bold inline-flex items-center gap-1.5">
            <HelpCircle size={12} /> Guía rápida · Métrica estimada
          </span>
          <h3 className="font-bold text-base mt-0.5 leading-snug">
            ¿Qué son las “Ventas recuperadas” y para qué sirven?
          </h3>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar explicación"
            className="p-1 text-muted hover:text-ink cursor-pointer shrink-0"
          >
            <X size={16} />
          </button>
        )}
      </div>

      <p className="text-xs sm:text-sm text-ink/90 leading-relaxed">
        <strong>No es dinero real ni devoluciones:</strong> es un indicador estimado de la facturación que evitaste perder
        al recuperar clientes que se habían ido disconformes y probablemente no iban a volver a comprar.
      </p>

      <ol className="space-y-1.5 text-xs text-muted leading-relaxed">
        <li className="flex items-start gap-2">
          <span className="bg-ink text-paper font-mono text-[10px] font-bold px-1.5 py-0.5 shrink-0">01</span>
          <span>Cargás en <strong>Ajustes</strong> tu <strong>ticket promedio</strong> (lo que gasta un cliente en una visita normal).</span>
        </li>
        <li className="flex items-start gap-2">
          <span className="bg-ink text-paper font-mono text-[10px] font-bold px-1.5 py-0.5 shrink-0">02</span>
          <span>Cuando entra un caso de rescate, Latido congela ese valor como referencia para que el cálculo sea siempre real.</span>
        </li>
        <li className="flex items-start gap-2">
          <span className="bg-ink text-paper font-mono text-[10px] font-bold px-1.5 py-0.5 shrink-0">03</span>
          <span>Solo suma cuando marcás el caso como <strong>Rescatado</strong> (si no responde, rechaza o se descarta, suma {formatMoney(0, currency)}).</span>
        </li>
      </ol>

      <div className="bg-paper-dim border border-line-gray border-l-4 border-l-teal px-3.5 py-2.5 space-y-1">
        <div className="font-mono text-[10px] uppercase tracking-wider font-bold text-teal">Ejemplo práctico</div>
        <p className="text-xs text-ink/90 leading-relaxed">
          Un local tiene un ticket promedio de <strong>{exampleTicket}</strong>. En el mes resuelve y recupera a{' '}
          <strong>5 clientes</strong> insatisfechos → la tarjeta muestra <strong>{exampleTotal} estimados</strong> en
          ventas conservadas gracias a responder a tiempo.
        </p>
      </div>

      <p className="text-xs text-muted leading-relaxed">
        <strong className="text-ink">¿Para qué te sirve?</strong> Para medir en pesos —y no solo en estrellas— el retorno real
        de atender rápido una mala experiencia y cuidar la retención de tus clientes mes a mes.
      </p>

      {onOpenSettings && isAdmin && Number(avgTicket || 0) <= 0 && (
        <div className="pt-1">
          <HardButton size="sm" variant="teal" onClick={onOpenSettings}>
            Configurar mi ticket promedio ahora
          </HardButton>
        </div>
      )}
    </aside>
  );
}
