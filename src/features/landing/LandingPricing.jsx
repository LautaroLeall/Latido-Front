import React from 'react';
import { motion } from 'framer-motion';
import { Check, MessageCircle, Mail } from 'lucide-react';
import HardButton from '../../components/ui/HardButton';
import { Reveal, SectionHeader } from './landingUi';
import usePlans, { formatPlanPrice } from './usePlans';
import { buildWhatsAppUrl, buildMailUrl, displayPhone, CONTACT_EMAIL } from '../../lib/contact';

const INCLUDED = [
  'Opiniones sin límite',
  'Modo Rescate completo',
  'Panel en tiempo real',
  'Todas tus sucursales',
  'Destino de reseñas (Google)',
  'Datos de clientes protegidos',
  'Mover soportes entre sucursales',
  'Soporte por WhatsApp'
];

function PlanCard({ plan, index }) {
  const price = formatPlanPrice(plan);
  const custom = plan.is_custom || price === null;

  return (
    <Reveal delay={index * 0.08} className="h-full">
      <motion.div whileHover={{ x: -2, y: -2 }}
        className={`relative h-full flex flex-col bg-paper border-[1.5px] p-7 ${plan.highlighted ? 'border-teal shadow-[5px_5px_0_#1F6F64]' : 'border-ink shadow-hard-line'
          }`}>
        {plan.highlighted && (
          <span className="absolute -top-3 left-5 bg-teal text-paper font-mono font-bold text-[10px] uppercase tracking-widest px-2.5 py-1">
            Más elegido
          </span>
        )}

        <h3 className="font-bold text-[18px]">{plan.name}</h3>

        <div className="mt-4 mb-1 min-h-[64px]">
          {custom ? (
            <div className="font-bold text-[26px] leading-tight tracking-tight">A medida</div>
          ) : (
            <div className="flex items-baseline gap-1.5">
              <span className="font-bold text-[34px] tracking-tight tabular-nums">{price}</span>
              <span className="font-mono text-[11px] text-muted uppercase">/ mes</span>
            </div>
          )}
        </div>

        <div className="font-mono text-[12px] font-bold text-amber-ink uppercase tracking-wider border-t-[1.5px] border-dashed border-line-gray pt-3 mb-5">
          {custom ? 'La cantidad de soportes que necesites' : `${plan.supports} ${plan.supports === 1 ? 'soporte' : 'soportes'} QR + NFC`}
        </div>

        <ul className="space-y-2 mb-7 flex-1">
          {INCLUDED.slice(0, 4).map(t => (
            <li key={t} className="flex items-start gap-2 text-[13px] text-ink/80">
              <Check size={14} className="text-teal mt-0.5 shrink-0" strokeWidth={3} />{t}
            </li>
          ))}
        </ul>

        {custom ? (
          <HardButton as="a" variant="secondary" className="w-full" target="_blank" rel="noopener noreferrer"
            href={buildWhatsAppUrl('Hola, quiero consultar por un plan personalizado de Latido. Necesito ___ soportes.')}>
            <MessageCircle size={14} /> Consultar
          </HardButton>
        ) : (
          <HardButton as="a" variant={plan.highlighted ? 'primary' : 'secondary'} className="w-full"
            target="_blank" rel="noopener noreferrer"
            href={buildWhatsAppUrl(`Hola, quiero contratar el ${plan.name} (${plan.supports} ${plan.supports === 1 ? 'soporte' : 'soportes'}) de Latido para mi negocio.`)}>
            <MessageCircle size={14} /> Contratar
          </HardButton>
        )}
      </motion.div>
    </Reveal>
  );
}

export default function LandingPricing() {
  const { plans } = usePlans();

  return (
    <section id="planes" className="py-24 px-6 bg-paper-dim">
      <div className="max-w-6xl mx-auto">
        <SectionHeader tag="Planes" title="Todos los planes incluyen todo"
          subtitle="La única diferencia es cuántos soportes (lámina + acrílico + chip NFC) usás. Pago mensual. Un soporte se puede usar en cualquier sucursal de tu negocio." />

        <div className={`grid grid-cols-1 sm:grid-cols-2 ${plans.length >= 4 ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-6`}>
          {plans.map((p, i) => <PlanCard key={p.id} plan={p} index={i} />)}
        </div>

        <Reveal delay={0.1} className="mt-12 bg-paper border-[1.5px] border-ink p-6 shadow-hard-line">
          <div className="font-mono text-[11px] uppercase tracking-widest text-teal font-bold mb-3">Incluido en todos los planes</div>
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-2">
            {INCLUDED.map(t => (
              <li key={t} className="flex items-start gap-2 text-[13px] text-ink/80">
                <Check size={14} className="text-teal mt-0.5 shrink-0" strokeWidth={3} />{t}
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal delay={0.1} className="mt-10 text-center">
          <p className="text-muted text-[14px] mb-4">¿Dudas o querés una demo? Escribinos y te respondemos hoy.</p>
          <div className="flex flex-wrap justify-center gap-3">
            <HardButton as="a" size="sm" target="_blank" rel="noopener noreferrer"
              href={buildWhatsAppUrl('Hola, quiero consultar por Latido para mi negocio.')}>
              <MessageCircle size={14} /> {displayPhone()}
            </HardButton>
            <HardButton as="a" size="sm" variant="secondary" target="_blank" rel="noopener noreferrer"
              href={buildMailUrl('Consulta sobre Latido', 'Hola, quiero consultar por Latido para mi negocio.')}>
              <Mail size={14} /> {CONTACT_EMAIL}
            </HardButton>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
