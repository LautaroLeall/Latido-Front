import React from 'react';
import { motion } from 'framer-motion';
import { Smartphone, ScanLine, LifeBuoy } from 'lucide-react';
import { Reveal, SectionHeader } from './landingUi';
import LiveDemo from './LiveDemo';

const STEPS = [
  { n: '01', icon: Smartphone, title: 'Poné tu soporte en el mostrador', desc: 'Lámina con tu logo, soporte de acrílico y chip NFC. Una sola URL: el QR y el chip abren el mismo ticket.' },
  { n: '02', icon: ScanLine, title: 'Tu cliente opina en 30 segundos', desc: 'Escanea o acerca el celular. Estrellas, un toque en lo que le gustó o falló y, si quiere, su contacto.' },
  { n: '03', icon: LifeBuoy, title: 'Vos rescatás a los insatisfechos', desc: 'Si dejó su contacto con una nota baja, se abre un caso con reloj y un mensaje de disculpa listo para enviar.' }
];

export default function LandingHowItWorks() {
  return (
    <section id="como-funciona" className="py-24 px-4 sm:px-6 bg-paper">
      <div className="max-w-5xl mx-auto">
        <SectionHeader tag="Cómo funciona" title="Tres pasos. Sin complicaciones."
          subtitle="Nada que instalar ni integrar: ponés el soporte y empezás a recibir opiniones." className="mb-16" />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-24">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            return (
              <Reveal key={s.n} delay={i * 0.12}>
                <motion.div whileHover={{ x: -2, y: -2 }} className="relative h-full bg-paper border-[1.5px] border-ink p-7 shadow-hard-line">
                  <span className="absolute -top-3 left-5 bg-ink text-paper font-mono font-bold text-[11px] tracking-widest px-2.5 py-1">{s.n}</span>
                  <div className="w-11 h-11 bg-paper-dim border border-line-gray flex items-center justify-center mb-4">
                    <Icon size={20} className="text-teal" />
                  </div>
                  <h3 className="font-bold text-[17px] leading-snug mb-2">{s.title}</h3>
                  <p className="text-muted text-[13.5px] leading-relaxed">{s.desc}</p>
                </motion.div>
              </Reveal>
            );
          })}
        </div>

        <SectionHeader tag="Probalo vos" title="Opiná como si fueras el cliente"
          subtitle="Elegí una nota. Con 1 o 2 estrellas y contacto, aparece el Modo Rescate. No se guarda nada." className="mb-10" />
        <Reveal><LiveDemo /></Reveal>
      </div>
    </section>
  );
}
