import React from 'react';
import { motion } from 'framer-motion';
import { Check, MessageCircle, Mail } from 'lucide-react';
import HardButton from '../../components/ui/HardButton';
import { Reveal, SectionHeader } from './landingUi';
import usePlans from './usePlans';
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
  const custom = Boolean(plan.is_custom || plan.supports == null);

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

        <div className="mt-4 mb-1 min-h-[68px]">
          {custom ? (
            <>
              <div className="font-bold text-[28px] leading-tight tracking-tight">A medida</div>
              <div className="font-mono text-[11px] font-bold text-teal uppercase tracking-wider mt-1">
                Suscripción mensual
              </div>
            </>
          ) : (
            <>
              <div className="flex items-baseline gap-1.5">
                <span className="font-bold text-[32px] leading-tight tracking-tight tabular-nums">
                  {plan.supports} {plan.supports === 1 ? 'soporte' : 'soportes'}
                </span>
              </div>
              <div className="font-mono text-[11px] font-bold text-teal uppercase tracking-wider mt-1">
                QR + NFC · Abono mensual
              </div>
            </>
          )}
        </div>

        <div className="font-mono text-[11.5px] font-bold text-amber-ink uppercase tracking-wider border-t-[1.5px] border-dashed border-line-gray pt-3 mb-5">
          {custom ? 'Los soportes que necesites' : 'Kit físico configurado'}
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
            href={buildWhatsAppUrl('Hola, quiero consultar por el valor mensual de un plan personalizado de Latido. Necesito ___ soportes QR + NFC.')}>
            <MessageCircle size={14} /> Consultar valor
          </HardButton>
        ) : (
          <HardButton as="a" variant={plan.highlighted ? 'primary' : 'secondary'} className="w-full"
            target="_blank" rel="noopener noreferrer"
            href={buildWhatsAppUrl(`Hola, quiero consultar el valor mensual del ${plan.name} (${plan.supports} ${plan.supports === 1 ? 'soporte' : 'soportes'} QR + NFC) de Latido para mi negocio.`)}>
            <MessageCircle size={14} /> Consultar valor
          </HardButton>
        )}
      </motion.div>
    </Reveal>
  );
}

export default function LandingPricing() {
  const { plans } = usePlans();

  return (
    <section id="planes" className="scroll-mt-16 py-16 sm:py-24 px-4 sm:px-6 bg-paper-dim">
      <div className="max-w-6xl mx-auto">
        <SectionHeader tag="Planes" title="Todos los planes incluyen todo"
          subtitle="Modalidad mensual, sin contratos largos. La única diferencia es cuántos soportes físicos (con tu logo, QR y chip NFC ya configurados) usás. Escribinos para conocer los valores vigentes." />

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
