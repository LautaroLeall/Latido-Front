import React from 'react';
import { Check, MessageCircle } from 'lucide-react';
import HardButton from '../../../../components/ui/HardButton';
import Stamp from '../../../../components/ui/Stamp';
import { formatMoney } from '../../../../lib/utils';
import { buildWhatsAppUrl } from '../../../../lib/contact';

export default function UpgradePlansGrid({ businessName, plans }) {
  if (!plans.length) return null;

  return (
    <section className="bg-paper border border-line-gray p-5">
      <div className="font-mono text-xs uppercase tracking-wider text-muted mb-3">
        Otros planes disponibles
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {plans.map(p => (
          <div key={p.id} className={`border p-4 flex flex-col justify-between gap-3 ${p.highlighted ? 'border-teal bg-teal/5' : 'border-line-gray bg-paper-dim/50'}`}>
            <div>
              <div className="flex items-center justify-between gap-2">
                <strong className="text-base">{p.name}</strong>
                {p.highlighted && <Stamp variant="teal">Recomendado</Stamp>}
              </div>
              <div className="font-bold text-2xl mt-2 tabular-nums">
                {p.is_custom || p.price_monthly == null
                  ? 'A medida'
                  : <>{formatMoney(p.price_monthly, p.currency)} <span className="font-mono text-[11px] font-normal text-muted">/ mes</span></>}
              </div>
              <div className="font-mono text-xs text-amber-ink font-bold mt-1">
                {p.is_custom ? 'Cantidad de soportes a medida' : `${p.supports} ${p.supports === 1 ? 'soporte' : 'soportes'} QR + NFC`}
              </div>
              <ul className="mt-3 space-y-1 text-xs text-muted">
                <li className="flex items-center gap-1.5"><Check size={13} className="text-teal" /> Todas las funciones incluidas</li>
                <li className="flex items-center gap-1.5"><Check size={13} className="text-teal" /> Válido para todas tus sucursales</li>
              </ul>
            </div>
            <HardButton
              as="a"
              size="sm"
              variant={p.highlighted ? 'teal' : 'secondary'}
              className="w-full"
              target="_blank"
              rel="noopener noreferrer"
              href={buildWhatsAppUrl(
                `Hola, soy de ${businessName} y quiero pasar al ${p.name}${p.supports ? ` (${p.supports} soportes)` : ''}.`
              )}
            >
              <MessageCircle size={13} /> Pedir este plan
            </HardButton>
          </div>
        ))}
      </div>
    </section>
  );
}
